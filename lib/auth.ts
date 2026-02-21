import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;

export interface AuthResult {
  success: boolean;
  error?: string;
}

export function verifyApiToken(request: NextRequest): AuthResult {
  if (!INTERNAL_API_TOKEN) {
    return {
      success: false,
      error: 'Server configuration error: INTERNAL_API_TOKEN not set'
    };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return {
      success: false,
      error: 'Missing Authorization header'
    };
  }

  const token = authHeader.replace('Bearer ', '');

  if (token !== INTERNAL_API_TOKEN) {
    return {
      success: false,
      error: 'Invalid API token'
    };
  }

  return { success: true };
}

export function createUnauthorizedResponse(error: string): NextResponse {
  return NextResponse.json(
    { error, success: false },
    { status: 401 }
  );
}
