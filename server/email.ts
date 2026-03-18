// email service for StuFi
// handles OTP codes, password resets, and spending alerts
// logs to console in dev mode, sends via SMTP/Gmail in production
import { Resend } from "resend";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

// Initialize Resend with your API Key
export const resend = new Resend(process.env.RESEND_API_KEY || "fallback_key");

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    // dev mode / fallback — print it out so we can debug
    console.log("=== EMAIL (dev mode - no Resend API key found) ===");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text}`);
    console.log("==================================================");
    return true;
  }

  try {
    // During Resend onboarding, you can only send emails TO your own verified email (the one you signed up with)
    // and FROM this exact onboarding domain. Once you verify your own custom domain (e.g. stufi.app), you update this.
    const { data, error } = await resend.emails.send({
      from: "StuFi <onboarding@resend.dev>",
      to: typeof options.to === 'string' ? [options.to] : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log("[Email] Sent successfully via Resend. ID:", data?.id);
    return true;
  } catch (err) {
    console.error("[Email] Unexpected error sending email:", err);
    return false;
  }
}

// send One-Time Password for login
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://stufi.app";
  return sendEmail({
    to: email,
    subject: "Your StuFi Login Code",
    text: `Your one-time login code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n\nOpen StuFi: ${appUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">StuFi</h2>
        <p>Your one-time login code is:</p>
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        <div style="text-align: center; margin: 24px 0 8px;">
          <a href="${appUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Open StuFi App</a>
        </div>
      </div>
    `,
  });
}

// password reset via 6-digit code
export async function sendPasswordResetCode(email: string, code: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://stufi.app";
  return sendEmail({
    to: email,
    subject: "Reset Your StuFi Password",
    text: `Your password reset code is: ${code}\n\nThis code expires in 30 minutes.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nOpen StuFi: ${appUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">StuFi</h2>
        <p>Your password reset code is:</p>
        <div style="background: #fff1f2; border: 2px solid #e11d48; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #e11d48;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 30 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
        <div style="text-align: center; margin: 24px 0 8px;">
          <a href="${appUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Open StuFi App</a>
        </div>
      </div>
    `,
  });
}

// alert when daily spending cap is exceeded
export async function sendDailyCapAlert(email: string, spent: number, cap: number): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Daily Spending Cap Exceeded - StuFi",
    text: `Warning: You've exceeded your daily spending cap!\n\nSpent today: GH₵${spent.toLocaleString()}\nDaily cap: GH₵${cap.toLocaleString()}\n\nConsider reviewing your expenses for today.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e11d48; margin-bottom: 20px;">Daily Cap Exceeded</h2>
        <p>Warning: You've exceeded your daily spending cap!</p>
        <div style="background: #fff1f2; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Spent today:</strong> GH₵${spent.toLocaleString()}</p>
          <p style="margin: 8px 0;"><strong>Daily cap:</strong> GH₵${cap.toLocaleString()}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Consider reviewing your expenses for today.</p>
      </div>
    `,
  });
}

// Fires when balance drops below 20% of starting amount
export async function sendCriticalBalanceAlert(email: string, balance: number, daysLeft: number): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Critical Balance Alert - StuFi",
    text: `Your balance is critically low!\n\nCurrent balance: GH₵${balance.toLocaleString()}\nDays until next allowance: ${daysLeft}\n\nConsider reducing spending to make it through the cycle.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e11d48; margin-bottom: 20px;">Critical Balance Alert</h2>
        <p>Your balance is critically low!</p>
        <div style="background: #fff1f2; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Current balance:</strong> GH₵${balance.toLocaleString()}</p>
          <p style="margin: 8px 0;"><strong>Days until next allowance:</strong> ${daysLeft}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Consider reducing spending to make it through the cycle.</p>
      </div>
    `,
  });
}
