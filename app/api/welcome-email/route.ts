import { NextResponse } from "next/server";

import { emailService } from "@/libs/resend";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 },
      );
    }

    const result = await emailService.sendWelcomeEmail(email, name);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error("Welcome email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
