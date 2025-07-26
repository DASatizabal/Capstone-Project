// app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { notificationService } from "@/lib/notification-service";
import { reminderScheduler } from "@/lib/reminder-scheduler";

// POST /api/notifications/test - Send test notifications (development only)
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test endpoints disabled in production" },
      { status: 404 },
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, email } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Type and email are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate notification type
    const validTypes = [
      "chore-assignment",
      "chore-reminder",
      "chore-completion",
      "photo-approval",
      "photo-rejection",
      "daily-digest",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid notification type",
          validTypes,
        },
        { status: 400 },
      );
    }

    let result: any;

    switch (type) {
      case "chore-assignment":
        result = await notificationService.sendChoreAssignmentNotification({
          choreId: "test-chore-id",
          choreTitle: "Test Chore Assignment",
          choreDescription: "This is a test chore assignment notification.",
          assignedTo: {
            id: session.user.id,
            name: session.user.name || "Test User",
            email,
          },
          assignedBy: {
            id: "parent-id",
            name: "Test Parent",
            email: "parent@test.com",
          },
          family: {
            id: "family-id",
            name: "Test Family",
          },
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          priority: "medium",
          points: 10,
          requiresPhotoVerification: true,
        });
        break;

      case "chore-reminder":
        result = await notificationService.sendChoreReminderNotification({
          choreId: "test-chore-id",
          choreTitle: "Test Chore Reminder",
          choreDescription: "This is a test chore reminder notification.",
          assignedTo: {
            id: session.user.id,
            name: session.user.name || "Test User",
            email,
          },
          assignedBy: {
            id: "parent-id",
            name: "Test Parent",
            email: "parent@test.com",
          },
          family: {
            id: "family-id",
            name: "Test Family",
          },
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
          daysUntilDue: 1,
          priority: "high",
          points: 15,
          requiresPhotoVerification: false,
        });
        break;

      case "chore-completion":
        result = await notificationService.sendChoreCompletionNotification(
          {
            choreId: "test-chore-id",
            choreTitle: "Test Chore Completion",
            choreDescription: "This is a test chore completion notification.",
            assignedTo: {
              id: session.user.id,
              name: session.user.name || "Test Child",
              email: "child@test.com",
            },
            assignedBy: {
              id: "parent-id",
              name: "Test Parent",
              email: "parent@test.com",
            },
            family: {
              id: "family-id",
              name: "Test Family",
            },
            priority: "medium",
            points: 20,
            requiresPhotoVerification: true,
          },
          [email],
        );
        break;

      case "photo-approval":
        result = await notificationService.sendPhotoApprovalNotification({
          choreId: "test-chore-id",
          choreTitle: "Test Photo Approval",
          assignedTo: {
            id: session.user.id,
            name: session.user.name || "Test Child",
            email,
          },
          assignedBy: {
            id: "parent-id",
            name: "Test Parent",
            email: "parent@test.com",
          },
          family: {
            id: "family-id",
            name: "Test Family",
          },
          priority: "medium",
          points: 25,
          requiresPhotoVerification: true,
          photoUrl: "https://example.com/test-photo.jpg",
        });
        break;

      case "photo-rejection":
        result = await notificationService.sendPhotoRejectionNotification({
          choreId: "test-chore-id",
          choreTitle: "Test Photo Rejection",
          assignedTo: {
            id: session.user.id,
            name: session.user.name || "Test Child",
            email,
          },
          assignedBy: {
            id: "parent-id",
            name: "Test Parent",
            email: "parent@test.com",
          },
          family: {
            id: "family-id",
            name: "Test Family",
          },
          priority: "medium",
          points: 25,
          requiresPhotoVerification: true,
          photoUrl: "https://example.com/test-photo.jpg",
          rejectionReason:
            "Please retake the photo with better lighting and make sure the whole area is visible.",
        });
        break;

      case "daily-digest":
        result = await notificationService.sendDailyDigest(
          email,
          "Test Family",
          {
            completedChores: [
              { title: "Clean bedroom", completedBy: "Alice", points: 10 },
              { title: "Take out trash", completedBy: "Bob", points: 5 },
            ],
            overdueChores: [
              { title: "Do dishes", assignedTo: "Charlie", daysOverdue: 2 },
            ],
            pendingApprovals: 3,
            totalPointsEarned: 15,
          },
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 },
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: "No result returned from notification service" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: result.success,
      message: `Test ${type} notification sent`,
      data: result.data || result,
      error: result.error || null,
      logId: result.logId || null,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      {
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/notifications/test - Get reminder statistics
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test endpoints disabled in production" },
      { status: 404 },
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const familyId = searchParams.get("familyId");

    const stats = await reminderScheduler.getReminderStats(
      familyId || undefined,
    );

    return NextResponse.json({
      success: true,
      stats,
      familyId: familyId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting reminder stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get reminder stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
