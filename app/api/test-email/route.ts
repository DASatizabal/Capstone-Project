// app/api/test-email/route.ts
import { NextResponse } from "next/server";

import { emailService } from "@/libs/resend";

// Only enable this endpoint in development
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Disabled in production" },
      { status: 404 },
    );
  }

  // Use a test email from environment variables or fallback
  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  try {
    const result = await emailService.sendWelcomeEmail(testEmail, "Test User");

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Optional: Keep GET for easier testing via browser
export async function GET() {
  return NextResponse.json({
    message: "Send a POST request to test email functionality",
    method: "POST",
    body: "{}",
  });
}
