# Email OTP Verification Setup Guide

## Overview
This guide walks you through setting up SMTP OTP email verification for Bucura AI. Users will need to verify their email with a 6-digit OTP before their account is created.

## Architecture

### Components
1. **Database Layer** (`USERS_SCHEMA.sql`)
   - `email_verification` table: Stores OTP requests and verification states
   - Functions: `request_email_verification()`, `verify_email_otp()`, `is_email_verified()`

2. **Backend Layer**
   - API Routes: `/api/auth/request-otp`, `/api/auth/verify-otp`
   - Utility Functions: `lib/emailVerification.ts`
   - Edge Function: `supabase/functions/send-otp-email/`

3. **Frontend Layer**
   - Hook: `hooks/useEmailVerification.ts`
   - Types: `types/emailVerification.ts`

4. **Email Service**
   - Gmail SMTP with App Password (configured via edge function)

## Step-by-Step Setup

### 1. Deploy Database Schema

Run the updated `USERS_SCHEMA.sql` against your Supabase database:

```sql
-- Execute the entire USERS_SCHEMA.sql file in Supabase SQL Editor
```

This will create:
- `public.email_verification` table
- Associated indexes
- RLS policies (allows anon users to insert/select/update)
- PL/pgSQL functions for OTP management
- Triggers for timestamp management

### 2. Configure Gmail SMTP Credentials

#### Option A: Gmail Account with App Password (Recommended)

1. Go to [Google Account Security Settings](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Generate an [App Password](https://myaccount.google.com/apppasswords)
4. Use these credentials for the edge function

#### Option B: Custom SMTP Server

If using a different SMTP provider, modify the `send-otp-email` edge function accordingly.

### 3. Set Up Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Deploy the Edge Function**:
   ```bash
   cd d:\factory\bucura-ai
   supabase functions deploy send-otp-email
   ```

3. **Set Environment Variables** in Supabase:
   ```
   GMAIL_USER: your-email@gmail.com
   GMAIL_APP_PASSWORD: your-16-char-app-password
   SUPABASE_URL: https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
   ```

   You can set these via:
   - Supabase Dashboard → Project Settings → Edge Functions → Environment Variables
   - Or using Supabase CLI:
     ```bash
     supabase secrets set GMAIL_USER="your-email@gmail.com"
     supabase secrets set GMAIL_APP_PASSWORD="your-16-char-app-password"
     ```

### 4. Environment Variables (.env.local)

Add to your `.env.local`:

```env
# These should already exist
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For development/testing
NEXT_PUBLIC_OTP_DEBUG=false
```

### 5. Integrate into SignUp Component

Update your `SignUpModal.tsx` or signup component:

```typescript
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useState } from 'react';

export function SignUpModal() {
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
  } = useEmailVerification();

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    // Step 1: Request OTP (if not already sent)
    if (!otpSent) {
      await requestOTP();
      return;
    }

    // Step 2: Verify OTP
    if (!verified) {
      await verifyOTP();
      return;
    }

    // Step 3: Create account (only after email is verified)
    if (verified && password && confirmPassword) {
      if (password !== confirmPassword) {
        // Show error
        return;
      }

      try {
        // Call your signup API with verified email
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            // The backend knows email is verified
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Redirect to login or auto-login
        }
      } catch (error) {
        // Handle error
      }
    }
  };

  return (
    <div className="signup-modal">
      {/* Step 1: Email Verification */}
      {!verified && (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={otpSent}
          />

          {!otpSent ? (
            <button
              onClick={requestOTP}
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : 'Request OTP'}
            </button>
          ) : (
            <>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOTP(e.target.value.slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                inputMode="numeric"
              />
              <button
                onClick={verifyOTP}
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="resend-section">
                <p>Attempts left: {attemptsLeft}</p>
                {resendCountdown > 0 ? (
                  <p>Resend in {resendCountdown}s</p>
                ) : (
                  <button onClick={resendOTP}>
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </>
      )}

      {/* Step 2: Password Setup (after email verified) */}
      {verified && (
        <>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
          <button onClick={handleSignUp}>
            Complete Sign Up
          </button>
        </>
      )}
    </div>
  );
}
```

### 6. Update Your Signup API Route

Create/update `/api/auth/signup`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isEmailVerified } from '@/lib/emailVerification';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Verify email was verified first
    const emailVerified = await isEmailVerified(email);
    if (!emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email not verified' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email is already verified
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
```

## API Endpoints

### POST /api/auth/request-otp

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "id": "uuid",
    "expiresAt": "2024-01-01T12:05:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email already verified" | "Rate limit exceeded" | "Please wait before resending"
}
```

### POST /api/auth/verify-otp

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "message": "Email verified successfully",
  "data": {
    "verifiedAt": "2024-01-01T12:01:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "verified": false,
  "message": "Invalid OTP" | "OTP expired" | "Max attempts exceeded"
}
```

## Security Considerations

### 1. OTP Storage
- OTPs are **hashed** in the database using SHA-256
- Never store plain-text OTPs
- Hashes use a salt to prevent rainbow table attacks

### 2. Rate Limiting
- Maximum 5 OTP requests per hour per email
- 60-second cooldown between resend attempts
- Maximum 5 verification attempts per OTP

### 3. Expiration
- OTPs expire after 5 minutes
- Expired records are auto-cleaned after 1 day

### 4. RLS Policies
- Anonymous users can insert/verify OTPs
- Only service role can cleanup old records
- Users cannot access other users' verification data

### 5. SMTP Security
- Gmail App Password stored in Supabase secrets
- Never expose credentials in client code
- Edge function validates all requests server-side

## Testing

### Manual Testing

```bash
# 1. Request OTP
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Check database for OTP
SELECT otp_code, expires_at, is_verified 
FROM email_verification 
WHERE email = 'test@example.com'
ORDER BY created_at DESC LIMIT 1;

# 3. Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Unit Tests Example

```typescript
// __tests__/emailVerification.test.ts
import { requestEmailOTP, verifyEmailOTP } from '@/lib/emailVerification';

describe('Email Verification', () => {
  it('should request OTP for valid email', async () => {
    const result = await requestEmailOTP('test@example.com');
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', async () => {
    const result = await requestEmailOTP('invalid-email');
    expect(result.success).toBe(false);
  });

  it('should verify correct OTP', async () => {
    // Get OTP from database
    const otp = '123456'; // Retrieved from DB
    const result = await verifyEmailOTP('test@example.com', otp);
    expect(result.verified).toBe(true);
  });
});
```

## Troubleshooting

### Issue: OTP not being sent

**Solutions:**
1. Check Gmail App Password is correct
2. Verify Supabase edge function environment variables are set
3. Check edge function logs: `supabase functions logs send-otp-email`
4. Ensure email address is valid

### Issue: OTP Expired too quickly

**Solution:**
- Increase expiration time in `request_email_verification()` function:
  ```sql
  v_expires_at := v_now + INTERVAL '10 minutes'; -- Change from 5
  ```

### Issue: Rate limit blocking legitimate users

**Solution:**
- Adjust limits in `request_email_verification()`:
  ```sql
  -- Increase from 5 to 10 requests per hour
  AND resend_count >= 10
  ```

### Issue: User locked out (max attempts exceeded)

**Solution:**
- Manually reset attempts in database:
  ```sql
  UPDATE email_verification 
  SET attempt_count = 0 
  WHERE email = 'user@example.com' AND is_verified = FALSE;
  ```

## Alternative SMTP Providers

### SendGrid
Replace the `send-otp-email` function with SendGrid API:

```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email }] }],
    from: { email: 'noreply@bucura-ai.com' },
    subject: 'Verify your email',
    content: [{ type: 'text/html', value: htmlContent }],
  }),
});
```

### Resend
```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'noreply@bucura-ai.com',
    to: email,
    subject: 'Verify your email',
    html: htmlContent,
  }),
});
```

## Next Steps

1. Deploy database schema to Supabase
2. Set up Gmail App Password
3. Deploy edge function
4. Integrate `useEmailVerification` hook into signup flow
5. Update signup API route to check email verification
6. Test with real email address
7. Monitor edge function logs in production

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Gmail App Passwords Setup](https://support.google.com/accounts/answer/185833)
- Bucura AI project documentation
