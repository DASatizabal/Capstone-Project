// app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { emailService } from '@/libs/resend';

// Only enable this endpoint in development
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 404 });
  }
  
  const testEmail = 'your-test-email@example.com';
  
  try {
    const result = await emailService.sendWelcomeEmail(
      testEmail,
      'Test User'
    );
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}