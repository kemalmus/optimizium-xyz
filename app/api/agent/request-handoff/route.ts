import { NextRequest } from 'next/server';
import {
  verifyApiToken,
  createSuccessResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/auth';
import { RequestHandoffSchema } from '@/lib/schemas';
import { storage, type StorageRecord } from '@/lib/storage';

// ============================================================================
// POST /api/agent/request-handoff
// ElevenLabs Tool: request_handoff
//
// Requests human follow-up and records urgency + reason.
// Use when topic is outside agent's authority or requires human decision.
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

    const validationResult = RequestHandoffSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // 3. Generate unique ID for this handoff
    const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 4. Store the handoff request
    const record: StorageRecord = {
      id: handoffId,
      timestamp: data.timestamp,
      type: 'handoff',
      data: {
        lead_id: data.lead_id,
        urgency: data.urgency,
        reason: data.reason,
        relevant_context: data.relevant_context,
      },
    };

    await storage.save(record);

    // 5. Get human contact info from env
    const humanContactName = process.env.HUMAN_CONTACT_NAME || 'Paweł';
    const brandName = process.env.BRAND_NAME || 'Optimizium';

    // 6. Return success response with follow-up info
    return createSuccessResponse(
      {
        handoff_id: handoffId,
        urgency: data.urgency,
        human_contact: humanContactName,
        brand: brandName,
        response_expected: data.urgency === 'high' ? 'within 2 hours' : 'within 24 hours',
      },
      'Handoff request received. Human follow-up initiated.',
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
    console.error('[HANDOFF] Unexpected error:', error);
    return createSuccessResponse(
      { error: 'Internal server error' },
      'An unexpected error occurred',
      500
    );
  }
}

// ============================================================================
// GET /api/agent/request-handoff (Health check)
// ============================================================================
export async function GET(request: NextRequest) {
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  const humanContactName = process.env.HUMAN_CONTACT_NAME || 'Paweł';
  const brandName = process.env.BRAND_NAME || 'Optimizium';

  return createSuccessResponse(
    {
      endpoint: '/api/agent/request-handoff',
      method: 'POST',
      description: 'Requests human follow-up and records urgency + reason',
      required_fields: ['timestamp', 'reason'],
      optional_fields: ['lead_id', 'urgency', 'relevant_context'],
      human_contact: humanContactName,
      brand: brandName,
      urgency_levels: ['low', 'medium', 'high'],
    },
    'Handoff API is operational'
  );
}
