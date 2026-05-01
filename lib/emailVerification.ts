import { createClient } from '@supabase/supabase-js';
import type {
  EmailVerificationResponse,
  OTPVerificationResponse,
  EmailVerificationState,
} from '@/types/emailVerification';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function requestEmailOTP(email: string): Promise<EmailVerificationResponse> {
  try {
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email format',
      };
    }

    // Call Supabase function to request OTP
    const { data, error } = await supabaseAdmin.rpc(
      'request_email_verification',
      { p_email: email }
    );

    if (error) {
      console.error('Error requesting OTP:', error);
      
      // Handle specific errors
      if (error.message.includes('INVALID_EMAIL')) {
        return { success: false, message: 'Invalid email address' };
      }
      if (error.message.includes('EMAIL_ALREADY_VERIFIED')) {
        return { success: false, message: 'Email already verified' };
      }
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        return { success: false, message: 'Too many requests. Try again later.' };
      }
      if (error.message.includes('RESEND_COOLDOWN_ACTIVE')) {
        return { success: false, message: 'Please wait before resending OTP' };
      }
      if (error.message.includes('OTP_NOT_EXPIRED')) {
        return { success: false, message: 'Previous OTP still active' };
      }
      
      return { success: false, message: 'Failed to request OTP' };
    }

    // Trigger edge function to send email
    try {
      const otpRecord = data?.[0];
      if (otpRecord) {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-otp-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            email,
            // Note: OTP code should only be available in the edge function context
            // The database only stores the hash for security
          }),
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails to send
      // User can retry with resend
    }

    return {
      success: true,
      message: 'OTP sent to your email',
      data: {
        id: data?.[0]?.id,
        expiresAt: data?.[0]?.expires_at,
      },
    };
  } catch (error) {
    console.error('Unexpected error in requestEmailOTP:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
    };
  }
}

export async function verifyEmailOTP(
  email: string,
  otp: string
): Promise<OTPVerificationResponse> {
  try {
    // Validate inputs
    if (!email || !otp) {
      return {
        success: false,
        verified: false,
        message: 'Email and OTP are required',
      };
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return {
        success: false,
        verified: false,
        message: 'OTP must be 6 digits',
      };
    }

    // Call Supabase function to verify OTP
    const { data, error } = await supabaseAdmin.rpc(
      'verify_email_otp',
      {
        p_email: email,
        p_otp: otp,
      }
    );

    if (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        verified: false,
        message: 'Failed to verify OTP',
      };
    }

    const result = data?.[0];

    if (!result?.success) {
      // Map error messages
      const errorMessages: Record<string, string> = {
        INVALID_EMAIL: 'Invalid email',
        INVALID_OTP_FORMAT: 'Invalid OTP format',
        NO_VERIFICATION_REQUEST: 'No verification request found',
        OTP_EXPIRED: 'OTP has expired. Please request a new one.',
        MAX_ATTEMPTS_EXCEEDED: 'Too many failed attempts. Please request a new OTP.',
        INVALID_OTP: 'Invalid OTP. Please try again.',
      };

      return {
        success: true,
        verified: false,
        message: errorMessages[result?.message] || result?.message || 'Invalid OTP',
      };
    }

    return {
      success: true,
      verified: true,
      message: 'Email verified successfully',
      data: {
        verifiedAt: result?.verified_at,
      },
    };
  } catch (error) {
    console.error('Unexpected error in verifyEmailOTP:', error);
    return {
      success: false,
      verified: false,
      message: 'An unexpected error occurred',
    };
  }
}

export async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'is_email_verified',
      { p_email: email }
    );

    if (error) {
      console.error('Error checking email verification:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Unexpected error in isEmailVerified:', error);
    return false;
  }
}

export async function getEmailVerificationState(
  email: string
): Promise<EmailVerificationState | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_verification')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const isExpired = expiresAt < now;

    return {
      email,
      otpSent: !isExpired && !data.is_verified,
      expiresAt: isExpired ? null : expiresAt,
      attemptsLeft: Math.max(0, 5 - (data.attempt_count || 0)),
      resendCountdown: Math.max(
        0,
        data.resend_last_at
          ? Math.ceil((60 - (now.getTime() - new Date(data.resend_last_at).getTime()) / 1000) / 1000)
          : 0
      ),
      message: data.is_verified ? 'Email verified' : 'Verification pending',
    };
  } catch (error) {
    console.error('Error getting email verification state:', error);
    return null;
  }
}
