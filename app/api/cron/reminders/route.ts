// app/api/cron/reminders/route.ts
import { NextRequest, NextResponse } from "next/server";

import { reminderScheduler } from "@/lib/reminder-scheduler";

// POST /api/cron/reminders - Process due reminders (called by cron service)
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
    console.log("Starting reminder processing job...");

    // Process due reminders
    await reminderScheduler.processDueReminders();

    const duration = Date.now() - startTime;
    console.log(`Reminder processing completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Reminders processed successfully",
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in reminder cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process reminders",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// GET /api/cron/reminders - Get job status (for monitoring)
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

    // Get reminder statistics
    const stats = await reminderScheduler.getReminderStats();

    return NextResponse.json({
      status: "healthy",
      stats,
      timestamp: new Date().toISOString(),
      nextRun: "Runs every hour", // Adjust based on your cron schedule
    });
  } catch (error) {
    console.error("Error getting cron status:", error);
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
