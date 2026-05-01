import { NextRequest, NextResponse } from 'next/server';
import { requestEmailOTP } from '@/lib/emailVerification';
import type { EmailVerificationRequest, EmailVerificationResponse } from '@/types/emailVerification';

export async function POST(request: NextRequest): Promise<NextResponse<EmailVerificationResponse>> {
  try {
    const body: EmailVerificationRequest = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Request OTP
    const response = await requestEmailOTP(trimmedEmail);

    return NextResponse.json(response, {
      status: response.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error in request-otp:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
