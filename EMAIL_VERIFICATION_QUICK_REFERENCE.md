// Quick Integration Guide - Email OTP Verification

// ============================================
// 1. USE THE HOOK IN YOUR COMPONENT
// ============================================

import { useEmailVerification } from '@/hooks/useEmailVerification';

export function MySignUpComponent() {
  const {
    email,
    setEmail,
    otp,
    setOTP,
    otpSent,
    verified,
    isLoading,
    error,
    success,
    attemptsLeft,
    resendCountdown,
    requestOTP,
    verifyOTP,
    resendOTP,
  } = useEmailVerification({
    onSuccess: (email) => {
      console.log(`${email} verified successfully`);
      // Proceed to next step (create account)
    },
    onError: (error) => {
      console.error(`Verification failed: ${error}`);
    },
  });

  return (
    <div>
      {/* EMAIL INPUT PHASE */}
      {!otpSent ? (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={isLoading}
          />
          <button
            onClick={requestOTP}
            disabled={isLoading || !email}
          >
            Send OTP Code
          </button>
        </>
      ) : null}

      {/* OTP INPUT PHASE */}
      {otpSent && !verified ? (
        <>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOTP(e.target.value.slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            inputMode="numeric"
            disabled={isLoading}
          />
          <button
            onClick={verifyOTP}
            disabled={isLoading || otp.length !== 6}
          >
            Verify OTP
          </button>

          <p>Attempts left: {attemptsLeft}</p>

          {resendCountdown > 0 ? (
            <p>Resend OTP in {resendCountdown}s</p>
          ) : (
            <button onClick={resendOTP} disabled={isLoading}>
              Resend OTP
            </button>
          )}
        </>
      ) : null}

      {/* VERIFICATION COMPLETE */}
      {verified ? (
        <p>✓ Email verified! Proceed to create password</p>
      ) : null}

      {/* ERROR/SUCCESS MESSAGES */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}

// ============================================
// 2. BACKEND FLOW IN SIGNUP API
// ============================================

import { isEmailVerified } from '@/lib/emailVerification';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // 1. VERIFY EMAIL WAS VERIFIED
  const emailVerified = await isEmailVerified(email);
  if (!emailVerified) {
    return NextResponse.json(
      { error: 'Please verify your email first' },
      { status: 400 }
    );
  }

  // 2. CREATE USER (email is pre-verified)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Mark as confirmed since verified via OTP
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ user });
}

// ============================================
// 3. DIRECT API CALLS (if not using hook)
// ============================================

// Request OTP
async function requestOTP(email: string) {
  const response = await fetch('/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

// Verify OTP
async function verifyOTP(email: string, otp: string) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return response.json();
}

// ============================================
// 4. DATABASE QUERIES
// ============================================

// Check if email is verified (admin only)
SELECT is_verified 
FROM email_verification 
WHERE email = 'user@example.com' 
AND is_verified = TRUE;

// Get verification status
SELECT 
  email,
  is_verified,
  expires_at,
  attempt_count,
  resend_count,
  created_at
FROM email_verification 
WHERE email = 'user@example.com'
ORDER BY created_at DESC 
LIMIT 1;

// Manual cleanup (if needed)
DELETE FROM email_verification
WHERE is_verified = FALSE 
AND expires_at < NOW() - INTERVAL '1 day';

// ============================================
// 5. CONFIGURATION
// ============================================

/*
Add to .env.local:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

Supabase Edge Function Environment:
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
*/

// ============================================
// 6. CONSTRAINTS & LIMITS
// ============================================

/*
OTP Configuration:
- Length: 6 digits
- Expiration: 5 minutes
- Max requests per hour: 5
- Max verification attempts: 5
- Resend cooldown: 60 seconds
- Rate limit window: 1 hour

Automatic cleanups:
- Expired unverified records deleted after 1 day
*/

// ============================================
// 7. ERROR CODES REFERENCE
// ============================================

/*
REQUEST-OTP ERRORS:
- INVALID_EMAIL: Email format invalid
- EMAIL_ALREADY_VERIFIED: Email already verified
- RATE_LIMIT_EXCEEDED: 5 requests in last hour
- RESEND_COOLDOWN_ACTIVE: Wait 60 seconds
- OTP_NOT_EXPIRED: Previous OTP still valid

VERIFY-OTP ERRORS:
- INVALID_EMAIL: Email format invalid
- INVALID_OTP_FORMAT: OTP not 6 digits
- NO_VERIFICATION_REQUEST: No OTP sent
- OTP_EXPIRED: OTP older than 5 minutes
- MAX_ATTEMPTS_EXCEEDED: 5 failed attempts
- INVALID_OTP: Wrong code entered
*/

// ============================================
// 8. TESTING CHECKLIST
// ============================================

/*
☐ Request OTP for valid email
☐ OTP sent notification appears
☐ OTP received in email
☐ Verify with correct OTP
☐ Email shows as verified
☐ Verify with wrong OTP - shows error
☐ Attempt limit exceeded - blocked
☐ OTP expires after 5 min - shows error
☐ Resend blocked within 60 seconds
☐ Can resend after 60 seconds
☐ Max 5 resends per hour enforced
☐ Signup fails if email not verified
☐ Signup succeeds if email verified
☐ Already verified email - rejected
*/
