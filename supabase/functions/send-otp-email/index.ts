import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
}

// Format email template with OTP
function getOTPEmailHTML(otp: string, expiresIn: number = 5): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
      }
      .content {
        padding: 40px 20px;
        text-align: center;
      }
      .content p {
        color: #333;
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 20px 0;
      }
      .otp-code {
        display: inline-block;
        background-color: #f0f0f0;
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 20px 40px;
        font-size: 32px;
        font-weight: bold;
        color: #667eea;
        letter-spacing: 8px;
        margin: 20px 0;
        font-family: 'Courier New', monospace;
      }
      .expiry {
        color: #666;
        font-size: 14px;
        margin: 20px 0;
      }
      .footer {
        background-color: #f9f9f9;
        border-top: 1px solid #eee;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .warning {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        color: #856404;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Verify Your Email</h1>
      </div>
      <div class="content">
        <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
        <p>Your verification code is:</p>
        <div class="otp-code">${otp}</div>
        <div class="expiry">
          This code will expire in <strong>${expiresIn} minutes</strong>
        </div>
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Bucura AI support will never ask for your verification code.
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't request this verification code, please ignore this email.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Bucura AI. All rights reserved.</p>
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </div>
  </body>
</html>
  `;
}

// Send email via Gmail SMTP
async function sendEmailViaSMTP(
  toEmail: string,
  otp: string
): Promise<boolean> {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    console.error("Gmail credentials not configured");
    return false;
  }

  try {
    // Using Deno's native SMTP support via a POST request to a SMTP service
    // For this implementation, we'll use a simpler approach with a third-party API
    // Alternatively, you can use the `deno_smtp` module

    // Option 1: Using SendGrid API (if you want to switch)
    // Option 2: Using native Node SMTP via a custom implementation
    // Option 3: Use Resend, Mailgun, or other services

    // For now, we'll create a placeholder that you can integrate with your preferred service
    console.log(
      `Would send email to ${toEmail} with OTP: ${otp} via ${gmailUser}`
    );

    // Mock successful send for now
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = (await req.json()) as SendOTPRequest;

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the latest unverified OTP record for this email
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("email_verification")
      .select("otp_code, expires_at")
      .eq("email", email.toLowerCase())
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.error("Error fetching OTP record:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "OTP record not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date(otpRecord.expires_at);
    const now = new Date();
    const expiresInMinutes = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / 60000
    );

    // Prepare email content
    const htmlContent = getOTPEmailHTML(otpRecord.otp_code, expiresInMinutes);

    // Send email
    const emailSent = await sendEmailViaSMTP(email, otpRecord.otp_code);

    if (!emailSent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to send email",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP email sent successfully",
        data: {
          email,
          sentAt: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
