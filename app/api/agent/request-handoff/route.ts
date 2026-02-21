import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken, createUnauthorizedResponse } from '@/lib/auth';

export interface HandoffRequest {
  agent_id: string;
  conversation_id: string;
  reason: string;
  urgency?: 'low' | 'medium' | 'high';
  context?: {
    user_name?: string;
    topic?: string;
    summary?: string;
    messages_count?: number;
  };
  contact_info?: {
    email?: string;
    phone?: string;
    preferred_method?: 'email' | 'phone';
  };
}

export async function POST(request: NextRequest) {
  // Verify API token
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  try {
    const body: HandoffRequest = await request.json();

    // Validate required fields
    if (!body.agent_id || !body.conversation_id || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, conversation_id, reason', success: false },
        { status: 400 }
      );
    }

    const humanContactName = process.env.HUMAN_CONTACT_NAME || 'Paweł';
    const brandName = process.env.BRAND_NAME || 'Optimizium';

    // TODO: Implement actual notification logic
    // Options:
    // - Send email via Resend/SendGrid
    // - Send Slack webhook
    // - Store in database for dashboard
    console.log('[HANDOFF REQUEST]', {
      agent_id: body.agent_id,
      conversation_id: body.conversation_id,
      reason: body.reason,
      urgency: body.urgency || 'medium',
      context: body.context,
      contact_info: body.contact_info,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Handoff request received',
      conversation_id: body.conversation_id,
      contact_info: {
        human_name: humanContactName,
        response_expected: 'within 24 hours',
        contact_method: 'will be determined based on your preference'
      }
    });

  } catch (error) {
    console.error('[HANDOFF ERROR]', error);
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
    message: 'Handoff API is operational',
    endpoint: '/api/agent/request-handoff',
    brand: process.env.BRAND_NAME || 'Optimizium'
  });
}
