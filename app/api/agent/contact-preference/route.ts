import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken, createUnauthorizedResponse } from '@/lib/auth';

export interface ContactPreferenceSubmission {
  agent_id: string;
  conversation_id: string;
  preferred_method?: 'email' | 'phone' | 'video_call' | 'in_person';
  preferred_time?: string;
  timezone?: string;
  email?: string;
  phone?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  // Verify API token
  const authResult = verifyApiToken(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error!);
  }

  try {
    const body: ContactPreferenceSubmission = await request.json();

    // Validate required fields
    if (!body.agent_id || !body.conversation_id) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, conversation_id', success: false },
        { status: 400 }
      );
    }

    // TODO: Implement actual storage logic
    // Options: Database (Vercel Postgres, Supabase, etc.)
    console.log('[CONTACT PREFERENCE]', {
      agent_id: body.agent_id,
      conversation_id: body.conversation_id,
      preferred_method: body.preferred_method,
      preferred_time: body.preferred_time,
      timezone: body.timezone,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
      metadata: body.metadata,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Contact preference saved',
      conversation_id: body.conversation_id,
      preference: {
        method: body.preferred_method || 'not_specified',
        time: body.preferred_time || 'not_specified'
      }
    });

  } catch (error) {
    console.error('[CONTACT PREFERENCE ERROR]', error);
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
    message: 'Contact preference API is operational',
    endpoint: '/api/agent/contact-preference',
    supported_methods: ['email', 'phone', 'video_call', 'in_person']
  });
}
