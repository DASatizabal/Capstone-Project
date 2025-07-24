// scripts/test-resend.js
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error('❌ RESEND_API_KEY is not set in .env.local');
  process.exit(1);
}

console.log('🔑 Resend API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');

const resend = new Resend(apiKey);

async function testResendConnection() {
  try {
    console.log('\n🔍 Testing Resend connection...');
    
    // Test the API key by making a simple request
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'test@example.com',
      subject: 'Resend Connection Test',
      html: '<p>This is a test email to verify Resend connection.</p>',
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify your RESEND_API_KEY is correct');
      console.log('2. Check if the API key has the right permissions');
      console.log('3. Make sure the domain is verified in your Resend dashboard');
      return;
    }

    console.log('✅ Resend connection successful!');
    console.log('📧 Email sent with ID:', data.id);
    console.log('\nNext steps:');
    console.log('1. Check your email inbox for the test message');
    console.log('2. Make sure to verify your sending domain in the Resend dashboard');
    
  } catch (err) {
    console.error('❌ Error testing Resend connection:');
    console.error(err);
  }
}

testResendConnection();
