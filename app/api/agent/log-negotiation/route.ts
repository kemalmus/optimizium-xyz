import { NextRequest } from 'next/server';
import {
  verifyApiToken,
  createSuccessResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/auth';
import { LogNegotiationSchema } from '@/lib/schemas';
import { storage, type StorageRecord } from '@/lib/storage';

// ============================================================================
// POST /api/agent/log-negotiation
// ElevenLabs Tool: log_negotiation_signal
//
// Captures any pricing/scope negotiation request, whether within guardrails or not.
// Logs both the request and whether it respects guardrails.
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

    const validationResult = LogNegotiationSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // 3. Generate unique ID for this negotiation signal
    const signalId = `negotiation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 4. Store the negotiation signal
    const record: StorageRecord = {
      id: signalId,
      timestamp: data.timestamp,
      type: 'negotiation',
      data: {
        lead_id: data.lead_id,
        topic: data.topic,
        requested_change: data.requested_change,
        within_guardrails: data.within_guardrails,
        conversation_context: data.conversation_context,
      },
    };

    await storage.save(record);

    // 5. Log for monitoring
    const guardrailStatus = data.within_guardrails ? '✓ WITHIN' : '⚠ OUTSIDE';
    console.log(`[NEGOTIATION] ${guardrailStatus} guardrails: ${data.topic} - ${data.requested_change}`);

    // 6. Return success response
    return createSuccessResponse(
      {
        signal_id: signalId,
        topic: data.topic,
        within_guardrails: data.within_guardrails,
        logged_at: new Date().toISOString(),
      },
      'Negotiation signal logged successfully',
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
    console.error('[NEGOTIATION] Unexpected error:', error);
    return createSuccessResponse(
      { error: 'Internal server error' },
      'An unexpected error occurred',
      500
    );
  }
}

// ============================================================================
// GET /api/agent/log-negotiation (Health check)
// ============================================================================
export async function GET(request: NextRequest) {
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  return createSuccessResponse(
    {
      endpoint: '/api/agent/log-negotiation',
      method: 'POST',
      description: 'Captures pricing/scope negotiation requests and guardrails compliance',
      required_fields: ['timestamp', 'topic', 'requested_change', 'within_guardrails'],
      optional_fields: ['lead_id', 'conversation_context'],
      supported_topics: ['retainer_hours', 'pricing', 'sequence', 'format', 'other'],
    },
    'Negotiation logging API is operational'
  );
}
