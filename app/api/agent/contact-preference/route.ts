import { NextRequest } from 'next/server';
import {
  verifyApiToken,
  createSuccessResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/auth';
import { CaptureContactPreferenceSchema } from '@/lib/schemas';
import { storage, type StorageRecord } from '@/lib/storage';

// ============================================================================
// POST /api/agent/contact-preference
// ElevenLabs Tool: capture_contact_preference
//
// Stores how/when the prospect prefers to be contacted.
// Optional but recommended for better follow-up experience.
// ============================================================================

export async function POST(request: NextRequest) {
  // 1. Verify authentication
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  try {
    // 2. Parse and validate request body
    const rawBody = await request.json();

    const validationResult = CaptureContactPreferenceSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // 3. Generate unique ID for this preference
    const preferenceId = `contact_pref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 4. Store the contact preference
    const record: StorageRecord = {
      id: preferenceId,
      timestamp: data.timestamp,
      type: 'contact_preference',
      data: {
        lead_id: data.lead_id,
        contact_method: data.contact_method,
        time_window: data.time_window,
        email: data.email,
      },
    };

    await storage.save(record);

    // 5. Return success response
    return createSuccessResponse(
      {
        preference_id: preferenceId,
        contact_method: data.contact_method,
        time_window: data.time_window || 'any time',
        email_provided: !!data.email,
      },
      'Contact preference saved successfully',
      201
    );

  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return createValidationErrorResponse({
        name: 'ZodError',
        issues: [{ message: 'Invalid JSON in request body', path: [], code: 'invalid_json' }],
      } as any);
    }

    // Log unexpected errors
    console.error('[CONTACT-PREFERENCE] Unexpected error:', error);
    return createSuccessResponse(
      { error: 'Internal server error' },
      'An unexpected error occurred',
      500
    );
  }
}

// ============================================================================
// GET /api/agent/contact-preference (Health check)
// ============================================================================
export async function GET(request: NextRequest) {
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  return createSuccessResponse(
    {
      endpoint: '/api/agent/contact-preference',
      method: 'POST',
      description: 'Stores how/when the prospect prefers to be contacted',
      required_fields: ['timestamp', 'contact_method'],
      optional_fields: ['lead_id', 'time_window', 'email'],
      supported_methods: ['email', 'call', 'no_preference'],
    },
    'Contact preference API is operational'
  );
}
