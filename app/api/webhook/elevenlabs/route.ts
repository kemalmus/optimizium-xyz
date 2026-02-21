import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[WEBHOOK] No WEBHOOK_SECRET configured, skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export interface ElevenLabsWebhookPayload {
  event_id?: string;
  event_type: string;
  timestamp?: string;
  data?: {
    conversation_id?: string;
    call_id?: string;
    agent_id?: string;
    duration_seconds?: number;
    transcript?: string;
    summary?: string;
    outcome?: string;
    metadata?: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload: ElevenLabsWebhookPayload = JSON.parse(rawBody);

    // Verify webhook signature if secret is configured
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-elevenlabs-signature') || '';
    if (signature && WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature)) {
      console.warn('[WEBHOOK] Invalid signature received');
      return NextResponse.json(
        { error: 'Invalid signature', success: false },
        { status: 401 }
      );
    }

    // Log webhook event
    console.log('[ELEVENLABS WEBHOOK]', {
      event_type: payload.event_type,
      event_id: payload.event_id,
      conversation_id: payload.data?.conversation_id,
      call_id: payload.data?.call_id,
      timestamp: payload.timestamp || new Date().toISOString()
    });

    // TODO: Implement event-specific logic
    switch (payload.event_type) {
      case 'call.completed':
      case 'conversation.ended':
      case 'call_ended':
        // Process completed call
        console.log('[WEBHOOK] Call completed', {
          conversation_id: payload.data?.conversation_id,
          duration: payload.data?.duration_seconds,
          outcome: payload.data?.outcome
        });
        break;

      case 'call.started':
      case 'conversation.started':
        // Track new call
        console.log('[WEBHOOK] Call started', {
          conversation_id: payload.data?.conversation_id
        });
        break;

      default:
        console.log('[WEBHOOK] Unknown event type:', payload.event_type);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      event_type: payload.event_type
    });

  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return NextResponse.json(
      { error: 'Invalid request body', success: false },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'ElevenLabs webhook endpoint is operational',
    endpoint: '/api/webhook/elevenlabs',
    configured: !!WEBHOOK_SECRET
  });
}
