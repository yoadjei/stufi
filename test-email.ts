import { sendOtpEmail } from './server/email';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
    console.log("Testing environment loading:");
    console.log("GMAIL_USER:", process.env.GMAIL_USER || "not set");
    console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "********" : "not set");
    console.log("SMTP_HOST:", process.env.SMTP_HOST || "not set");
    console.log("\nAttempting to send test OTP email...");
    
    try {
        const success = await sendOtpEmail('test@example.com', '123456');
        if (success) {
            console.log("✅ Email sent successfully (or simulated successfully in dev mode if no transport)!");
        } else {
            console.log("❌ Failed to send email.");
        }
    } catch (e) {
        console.error("❌ Exception during send:", e);
    }
}

testEmail();
