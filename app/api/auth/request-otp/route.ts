import { NextRequest, NextResponse } from 'next/server';
import { requestEmailOTP } from '@/lib/emailVerification';
import type { EmailVerificationRequest, EmailVerificationResponse } from '@/types/emailVerification';
import dns from 'dns/promises';

async function domainHasMX(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info','tempmail.com',
  'temp-mail.org','throwam.com','throwam.net','sharklasers.com','guerrillamailblock.com',
  'grr.la','guerrillamail.info','spam4.me','trashmail.com','trashmail.me',
  'trashmail.net','trashmail.at','trashmail.io','trashmail.xyz','dispostable.com',
  'mailnull.com','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc',
  'nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf','moncourrier.fr.nf',
  'monemail.fr.nf','monmail.fr.nf','fakeinbox.com','mailnesia.com','maildrop.cc',
  'spamfree24.org','spamfree24.de','spamfree24.net','spamfree24.info','spamfree24.biz',
  'spamfree.eu','spam.la','spambox.us','discard.email','getnada.com','nada.email',
  'throwam.com','mohmal.com','emailondeck.com','tempinbox.com','mailnew.com',
  'spamevader.com','spoofmail.de','binkmail.com','bobmail.info','chammy.info',
  'devnullmail.com','hatespam.org','jetable.com','jetable.net','jetable.org',
  'nospam4.us','obobbo.com','rklips.com','spamfree24.eu','tempomail.fr',
  'throwam.com','zippymail.info','sogetthis.com','spamgob.com',
]);

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

    // Basic format check
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Block disposable/temporary email services
    const domain = trimmedEmail.split('@')[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json(
        { success: false, message: 'Temporary or disposable email addresses are not allowed. Please use your real email.' },
        { status: 400 }
      );
    }

    // Check domain actually has mail servers
    const mxExists = await domainHasMX(domain);
    if (!mxExists) {
      return NextResponse.json(
        { success: false, message: 'This email domain does not exist or cannot receive emails. Please use a valid email address.' },
        { status: 400 }
      );
    }

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

export async function OPTIONS(_request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
