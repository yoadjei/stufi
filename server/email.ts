// email service for StuFi
// handles OTP codes, password resets, and spending alerts
// logs to console in dev mode, sends via SMTP/Gmail in production
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

// Build the transporter fresh each call if not yet cached
// (don't cache null — env vars might not be loaded at first call)
function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    console.log(`[email] Configuring Gmail transport for ${gmailUser}`);
    // Use explicit SMTP settings instead of "service: gmail" for better
    // compatibility with hosted environments (Render, Railway, etc.)
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL — most reliable on cloud hosts
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    return transporter;
  }

  // fallback to generic SMTP if configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return transporter;
  }

  console.warn("[email] No SMTP credentials found in environment — emails will be logged to console only.");
  // Return null but do NOT cache it, so the next call can retry
  return null;
}


async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    // dev mode — print it out so we can debug
    console.log("=== EMAIL (dev mode) ===");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text}`);
    console.log("========================");
    return true;
  }

  try {
    const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || "noreply@stufi.app";
    await transport.sendMail({
      from: `"StuFi" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// send One-Time Password for login
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Your StuFi Login Code",
    text: `Your one-time login code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">StuFi</h2>
        <p>Your one-time login code is:</p>
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// password reset via 6-digit code
export async function sendPasswordResetCode(email: string, code: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Reset Your StuFi Password",
    text: `Your password reset code is: ${code}\n\nThis code expires in 30 minutes.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">StuFi</h2>
        <p>Your password reset code is:</p>
        <div style="background: #fff1f2; border: 2px solid #e11d48; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #e11d48;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 30 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// password reset via clickable link
export async function sendPasswordResetLink(email: string, resetUrl: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Reset Your StuFi Password",
    text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">StuFi</h2>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 30 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
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
