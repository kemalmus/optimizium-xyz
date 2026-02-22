import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// ============================================================================
// Auth Types
// ============================================================================
export interface AuthResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Standard API Response Format
// ============================================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ============================================================================
// Token Verification
// ============================================================================
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

  // Support both "Bearer token" and just "token" formats
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (token !== INTERNAL_API_TOKEN) {
    return {
      success: false,
      error: 'Invalid API token'
    };
  }

  return { success: true };
}

// ============================================================================
// Webhook Signature Verification
// ============================================================================
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[AUTH] WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow in development if no secret set
  }

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

// ============================================================================
// Response Helpers
// ============================================================================
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: code ? `${code}: ${error}` : error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createUnauthorizedResponse(error: string): NextResponse<ApiResponse> {
  return createErrorResponse(error, 401, 'UNAUTHORIZED');
}

export function createBadRequestResponse(error: string): NextResponse<ApiResponse> {
  return createErrorResponse(error, 400, 'BAD_REQUEST');
}

export function createValidationErrorResponse(zodError: ZodError<any>): NextResponse<ApiResponse> {
  const formattedErrors = zodError.issues.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

// ============================================================================
// Middleware-style wrappers
// ============================================================================
export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = verifyApiToken(request);

    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error!);
    }

    return handler(request);
  };
}

export function withOptionalAuth(
  handler: (request: NextRequest, authPassed: boolean) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = verifyApiToken(request);
    return handler(request, authResult.success);
  };
}
