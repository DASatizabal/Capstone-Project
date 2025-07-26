import { NextResponse } from "next/server";

import { uploadToS3 } from "@/libs/s3";

export async function GET() {
  try {
    const fakeImageBuffer = Buffer.from("hello world");
    const result = await uploadToS3({
      buffer: fakeImageBuffer,
      key: `test-file-${Date.now()}.txt`,
      contentType: "text/plain",
    });

    return NextResponse.json({ url: result });
  } catch (error: any) {
    console.error("❌ S3 Upload Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 },
    );
  }
}
