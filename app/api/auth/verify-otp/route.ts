import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailOTP } from '@/lib/emailVerification';
import type { OTPVerificationRequest, OTPVerificationResponse } from '@/types/emailVerification';

export async function POST(request: NextRequest): Promise<NextResponse<OTPVerificationResponse>> {
  try {
    const body: OTPVerificationRequest = await request.json();
    const { email, otp } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'OTP is required',
        },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOTP = otp.trim();

    // Verify OTP
    const response = await verifyEmailOTP(trimmedEmail, trimmedOTP);

    return NextResponse.json(response, {
      status: response.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
