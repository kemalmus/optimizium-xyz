import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken, createUnauthorizedResponse } from '@/lib/auth';

export interface NegotiationSignal {
  agent_id: string;
  conversation_id: string;
  signal_type: 'price_concern' | 'timeline_concern' | 'competitor_mention' | 'objection' | 'interest' | 'commitment';
  content: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  metadata?: {
    user_intent?: string;
    proposed_price?: number;
    mentioned_competitor?: string;
    deadline_mentioned?: string;
    budget_indicated?: number;
  };
}

export async function POST(request: NextRequest) {
  // Verify API token
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  try {
    const body: NegotiationSignal = await request.json();

    // Validate required fields
    if (!body.agent_id || !body.conversation_id || !body.signal_type || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, conversation_id, signal_type, content', success: false },
        { status: 400 }
      );
    }

    // Validate signal_type
    const validSignalTypes = ['price_concern', 'timeline_concern', 'competitor_mention', 'objection', 'interest', 'commitment'];
    if (!validSignalTypes.includes(body.signal_type)) {
      return NextResponse.json(
        { error: `Invalid signal_type. Must be one of: ${validSignalTypes.join(', ')}`, success: false },
        { status: 400 }
      );
    }

    // TODO: Implement actual storage/analytics logic
    // Options:
    // - Store in database for analytics
    // - Send to analytics platform (Mixpanel, Amplitude, etc.)
    // - Trigger alerts for high-priority signals
    console.log('[NEGOTIATION SIGNAL]', {
      agent_id: body.agent_id,
      conversation_id: body.conversation_id,
      signal_type: body.signal_type,
      content: body.content,
      sentiment: body.sentiment,
      metadata: body.metadata,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Negotiation signal logged',
      conversation_id: body.conversation_id,
      signal_type: body.signal_type
    });

  } catch (error) {
    console.error('[NEGOTIATION LOG ERROR]', error);
    return NextResponse.json(
      { error: 'Invalid request body', success: false },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verify API token
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  return NextResponse.json({
    success: true,
    message: 'Negotiation logging API is operational',
    endpoint: '/api/agent/log-negotiation',
    supported_signals: ['price_concern', 'timeline_concern', 'competitor_mention', 'objection', 'interest', 'commitment']
  });
}
