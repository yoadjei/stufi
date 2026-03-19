import 'dotenv/config';
import { resend, sendEmail } from './server/email.js'; // Note we are pretending it's compiled JS for the node test script



console.log('Testing Resend with key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

async function test() {
  const success = await sendEmail({
    to: 'adjeiyawosei@gmail.com',
    subject: 'Test Email from StuFi (Resend)',
    text: 'If you are reading this, the Resend integration works perfectly!',
    html: '<h2>Success!</h2><p>If you are reading this, the Resend integration works perfectly!</p>'
  });

  if (success) {
    console.log("Email test completely successful!");
  } else {
    console.log("Email test failed. See errors above.");
  }
}

test();
