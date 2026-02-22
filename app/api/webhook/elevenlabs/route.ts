import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  verifyWebhookSignature,
} from '@/lib/auth';
import { ElevenLabsWebhookSchema } from '@/lib/schemas';
import { storage, type StorageRecord } from '@/lib/storage';

// ============================================================================
// POST /api/webhook/elevenlabs
// ElevenLabs Conversation Webhook
//
// Receives webhook events from ElevenLabs after conversations end.
// Verifies signature using WEBHOOK_SECRET for security.
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text();

    // 2. Verify signature if WEBHOOK_SECRET is set
    const signature = request.headers.get('x-webhook-signature') ||
                     request.headers.get('x-elevenlabs-signature') ||
                     '';

    if (!verifyWebhookSignature(rawBody, signature)) {
      return createErrorResponse('Invalid webhook signature', 401, 'UNAUTHORIZED');
    }

    // 3. Parse and validate payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return createErrorResponse('Invalid JSON payload', 400, 'INVALID_JSON');
    }

    const validationResult = ElevenLabsWebhookSchema.safeParse(payload);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // 4. Store webhook event
    const webhookId = `webhook_${data.event_type || 'unknown'}_${Date.now()}`;

    const record: StorageRecord = {
      id: webhookId,
      timestamp: data.timestamp || new Date().toISOString(),
      type: 'webhook',
      data: {
        event_id: data.event_id,
        event_type: data.event_type,
        conversation_id: data.data?.conversation_id,
        call_id: data.data?.call_id,
        agent_id: data.data?.agent_id,
        duration_seconds: data.data?.duration_seconds,
        transcript: data.data?.transcript,
        summary: data.data?.summary,
        outcome: data.data?.outcome,
        metadata: data.data?.metadata,
      },
    };

    await storage.save(record);

    // 5. Log event type for monitoring
    console.log(`[WEBHOOK] ${data.event_type} - ${data.data?.conversation_id || 'no-id'}`);

    // 6. Handle specific event types
    switch (data.event_type) {
      case 'call.completed':
      case 'conversation.ended':
      case 'call_ended':
        console.log(`[WEBHOOK] Call completed - Duration: ${data.data?.duration_seconds}s, Outcome: ${data.data?.outcome || 'N/A'}`);
        break;

      case 'call.started':
      case 'conversation.started':
        console.log(`[WEBHOOK] Call started - ${data.data?.conversation_id}`);
        break;

      default:
        console.log(`[WEBHOOK] Unknown event type: ${data.event_type}`);
    }

    // 7. Return success response
    return createSuccessResponse(
      {
        webhook_id: webhookId,
        event_type: data.event_type,
        processed_at: new Date().toISOString(),
      },
      'Webhook received and processed',
      200
    );

  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error);
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// ============================================================================
// GET /api/webhook/elevenlabs (Health check - no auth required for webhook endpoint)
// ============================================================================
export async function GET(request: NextRequest) {
  const webhookSecretSet = !!process.env.WEBHOOK_SECRET;

  return createSuccessResponse(
    {
      endpoint: '/api/webhook/elevenlabs',
      method: 'POST',
      description: 'ElevenLabs conversation webhook endpoint',
      signature_verification: webhookSecretSet ? 'enabled (WEBHOOK_SECRET set)' : 'disabled (WEBHOOK_SECRET not set)',
      supported_events: [
        'call.completed',
        'conversation.ended',
        'call_ended',
        'call.started',
        'conversation.started',
      ],
    },
    'Webhook endpoint is operational'
  );
}
