// app/api/cron/daily-digest/route.ts
import { NextRequest, NextResponse } from "next/server";

import { reminderScheduler } from "@/lib/reminder-scheduler";

// POST /api/cron/daily-digest - Process daily digests (called by cron service)
export async function POST(req: NextRequest) {
  try {
    // Verify the request is from an authorized cron service
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    console.log("Starting daily digest processing job...");

    // Process daily digests
    await reminderScheduler.processDailyDigests();

    const duration = Date.now() - startTime;
    console.log(`Daily digest processing completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Daily digests processed successfully",
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in daily digest cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process daily digests",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// GET /api/cron/daily-digest - Get job status (for monitoring)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      status: "healthy",
      message: "Daily digest cron job is operational",
      timestamp: new Date().toISOString(),
      schedule: "Runs every hour to check for scheduled digests",
    });
  } catch (error) {
    console.error("Error getting daily digest cron status:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to get status",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
