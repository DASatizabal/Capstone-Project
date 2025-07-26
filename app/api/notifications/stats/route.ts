// app/api/notifications/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Family from "@/models/Family";
import NotificationLog from "@/models/NotificationLog";

// GET /api/notifications/stats - Get notification statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const familyId = searchParams.get("familyId");
    const days = parseInt(searchParams.get("days") || "30");

    await dbConnect();

    // Verify family access if familyId is provided
    if (familyId) {
      const family = await Family.findById(familyId);
      if (!family) {
        return NextResponse.json(
          { error: "Family not found" },
          { status: 404 },
        );
      }

      const isFamilyMember = family.members.some(
        (m: any) => m.user.toString() === session.user.id,
      );

      if (!isFamilyMember) {
        return NextResponse.json(
          { error: "You are not a member of this family" },
          { status: 403 },
        );
      }
    }

    // Get notification statistics
    const stats = await NotificationLog.getNotificationStats(
      session.user.id,
      familyId || undefined,
      days,
    );

    // Get recent notifications
    const recentQuery: any = {
      user: session.user.id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    };

    if (familyId) {
      recentQuery.family = familyId;
    }

    const recentNotifications = await NotificationLog.find(recentQuery)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("family", "name")
      .populate("chore", "title");

    // Calculate summary statistics
    const totalNotifications = await NotificationLog.countDocuments({
      user: session.user.id,
      ...(familyId ? { family: familyId } : {}),
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });

    const successfulNotifications = await NotificationLog.countDocuments({
      user: session.user.id,
      ...(familyId ? { family: familyId } : {}),
      status: { $in: ["sent", "opened", "clicked"] },
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });

    const failedNotifications = await NotificationLog.countDocuments({
      user: session.user.id,
      ...(familyId ? { family: familyId } : {}),
      status: "failed",
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });

    const openedNotifications = await NotificationLog.countDocuments({
      user: session.user.id,
      ...(familyId ? { family: familyId } : {}),
      status: { $in: ["opened", "clicked"] },
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });

    const clickedNotifications = await NotificationLog.countDocuments({
      user: session.user.id,
      ...(familyId ? { family: familyId } : {}),
      status: "clicked",
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });

    return NextResponse.json({
      summary: {
        total: totalNotifications,
        successful: successfulNotifications,
        failed: failedNotifications,
        opened: openedNotifications,
        clicked: clickedNotifications,
        deliveryRate:
          totalNotifications > 0
            ? ((successfulNotifications / totalNotifications) * 100).toFixed(1)
            : "0",
        openRate:
          successfulNotifications > 0
            ? ((openedNotifications / successfulNotifications) * 100).toFixed(1)
            : "0",
        clickRate:
          openedNotifications > 0
            ? ((clickedNotifications / openedNotifications) * 100).toFixed(1)
            : "0",
      },
      byType: stats.reduce((acc: any, stat: any) => {
        acc[stat._id] = {
          total: stat.totalCount,
          breakdown: stat.stats.reduce((breakdown: any, s: any) => {
            breakdown[s.status] = {
              count: s.count,
              avgDeliveryTime: s.avgDeliveryTime
                ? Math.round(s.avgDeliveryTime)
                : null,
            };
            return breakdown;
          }, {}),
        };
        return acc;
      }, {}),
      recent: recentNotifications.map((notification) => ({
        id: notification._id,
        type: notification.type,
        status: notification.status,
        subject: notification.subject,
        recipient: notification.recipient,
        familyName: notification.family?.name,
        choreTitle: notification.chore?.title,
        createdAt: notification.createdAt,
        sentAt: notification.sentAt,
        openedAt: notification.openedAt,
        clickedAt: notification.clickedAt,
        failedAt: notification.failedAt,
        error: notification.error,
      })),
      period: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification statistics" },
      { status: 500 },
    );
  }
}
