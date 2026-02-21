import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken, createUnauthorizedResponse } from '@/lib/auth';

export interface FeedbackSubmission {
  agent_id: string;
  conversation_id: string;
  feedback_text: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  timestamp?: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  // Verify API token
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  try {
    const body: FeedbackSubmission = await request.json();

    // Validate required fields
    if (!body.agent_id || !body.conversation_id || !body.feedback_text) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, conversation_id, feedback_text', success: false },
        { status: 400 }
      );
    }

    // TODO: Implement actual storage logic
    // Options: Database (Vercel Postgres, Supabase, etc.)
    // For now, log the feedback
    console.log('[FEEDBACK SUBMISSION]', {
      agent_id: body.agent_id,
      conversation_id: body.conversation_id,
      feedback_text: body.feedback_text,
      sentiment: body.sentiment,
      timestamp: body.timestamp || new Date().toISOString(),
      metadata: body.metadata
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback received',
      conversation_id: body.conversation_id
    });

  } catch (error) {
    console.error('[FEEDBACK ERROR]', error);
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
    message: 'Feedback API is operational',
    endpoint: '/api/agent/submit-feedback'
  });
}
