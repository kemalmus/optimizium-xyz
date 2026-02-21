import { NextRequest } from 'next/server';
import {
  verifyApiToken,
  createSuccessResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/auth';
import { SubmitFeedbackSchema } from '@/lib/schemas';
import { storage, type StorageRecord } from '@/lib/storage';

// ============================================================================
// POST /api/agent/submit-feedback
// ElevenLabs Tool: submit_feedback
//
// Stores structured conversation summary and lead qualification data.
// Use after gathering sufficient context during the conversation.
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

    const validationResult = SubmitFeedbackSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // 3. Generate unique ID for this feedback
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 4. Store the feedback
    const record: StorageRecord = {
      id: feedbackId,
      timestamp: data.timestamp,
      type: 'feedback',
      data: {
        lead_id: data.lead_id,
        company: data.company,
        contact_name: data.contact_name,
        language: data.language,
        offer_version: data.offer_version,
        conversation_channel: data.conversation_channel,
        interest_level: data.interest_level,
        fit_assessment: data.fit_assessment,
        stated_priorities: data.stated_priorities,
        constraints: data.constraints,
        objections: data.objections,
        negotiation_signals: data.negotiation_signals,
        next_step_preference: data.next_step_preference,
        contact_preference: data.contact_preference,
        human_handoff_requested: data.human_handoff_requested,
        agent_summary: data.agent_summary,
      },
    };

    await storage.save(record);

    // 5. Return success response
    return createSuccessResponse(
      {
        feedback_id: feedbackId,
        lead_id: data.lead_id,
        interest_level: data.interest_level,
        next_step: data.next_step_preference,
      },
      'Feedback submitted successfully',
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
    console.error('[SUBMIT-FEEDBACK] Unexpected error:', error);
    return createSuccessResponse(
      { error: 'Internal server error' },
      'An unexpected error occurred',
      500
    );
  }
}

// ============================================================================
// GET /api/agent/submit-feedback (Health check)
// ============================================================================
export async function GET(request: NextRequest) {
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  return createSuccessResponse(
    {
      endpoint: '/api/agent/submit-feedback',
      method: 'POST',
      description: 'Stores structured conversation summary and lead qualification data',
      required_fields: [
        'timestamp',
        'language',
        'offer_version',
        'conversation_channel',
        'interest_level',
        'fit_assessment',
        'stated_priorities',
        'objections',
        'next_step_preference',
        'agent_summary',
      ],
    },
    'Feedback API is operational'
  );
}
