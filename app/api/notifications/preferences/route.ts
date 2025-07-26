// app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Family from "@/models/Family";
import NotificationPreferences from "@/models/NotificationPreferences";

// GET /api/notifications/preferences - Get user's notification preferences for all families
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const familyId = searchParams.get("familyId");

    await dbConnect();

    if (familyId) {
      // Get preferences for specific family
      const preferences = await NotificationPreferences.getOrCreatePreferences(
        session.user.id,
        familyId,
      );

      return NextResponse.json(preferences);
    } else {
      // Get preferences for all user's families
      const preferences = await NotificationPreferences.find({
        user: session.user.id,
      }).populate("family", "name");

      return NextResponse.json(preferences);
    }
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 },
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    const { familyId, ...preferencesUpdates } = updates;

    if (!familyId) {
      return NextResponse.json(
        { error: "familyId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Verify user is a member of the family
    const family = await Family.findById(familyId);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
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

    // Get or create preferences
    const preferences = await NotificationPreferences.getOrCreatePreferences(
      session.user.id,
      familyId,
    );

    // Validate time formats
    const timeFields = ["dailyDigestTime", "weeklyReportTime"];
    const quietHourFields = ["quietHours.startTime", "quietHours.endTime"];

    for (const field of timeFields) {
      if (preferencesUpdates[field]) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(preferencesUpdates[field])) {
          return NextResponse.json(
            { error: `${field} must be in HH:MM format` },
            { status: 400 },
          );
        }
      }
    }

    for (const field of quietHourFields) {
      const fieldPath = field.split(".");
      if (
        fieldPath.length === 2 &&
        preferencesUpdates[fieldPath[0]] &&
        preferencesUpdates[fieldPath[0]][fieldPath[1]]
      ) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(preferencesUpdates[fieldPath[0]][fieldPath[1]])) {
          return NextResponse.json(
            { error: `${field} must be in HH:MM format` },
            { status: 400 },
          );
        }
      }
    }

    // Validate reminder timing
    if (preferencesUpdates.reminderTiming) {
      const { firstReminder, secondReminder, finalReminder } =
        preferencesUpdates.reminderTiming;

      if (
        firstReminder !== undefined &&
        (firstReminder < 0 || firstReminder > 7)
      ) {
        return NextResponse.json(
          { error: "First reminder must be between 0 and 7 days" },
          { status: 400 },
        );
      }

      if (
        secondReminder !== undefined &&
        (secondReminder < 0 || secondReminder > 7)
      ) {
        return NextResponse.json(
          { error: "Second reminder must be between 0 and 7 days" },
          { status: 400 },
        );
      }

      if (
        finalReminder !== undefined &&
        (finalReminder < 0 || finalReminder > 24)
      ) {
        return NextResponse.json(
          { error: "Final reminder must be between 0 and 24 hours" },
          { status: 400 },
        );
      }
    }

    // Validate weekly report day
    if (preferencesUpdates.weeklyReportDay !== undefined) {
      if (
        preferencesUpdates.weeklyReportDay < 0 ||
        preferencesUpdates.weeklyReportDay > 6
      ) {
        return NextResponse.json(
          {
            error:
              "Weekly report day must be between 0 (Sunday) and 6 (Saturday)",
          },
          { status: 400 },
        );
      }
    }

    // Apply updates
    Object.assign(preferences, preferencesUpdates);
    await preferences.save();

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 },
    );
  }
}

// POST /api/notifications/preferences - Create preferences for a family
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyId, ...preferencesData } = await req.json();

    if (!familyId) {
      return NextResponse.json(
        { error: "familyId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Verify user is a member of the family
    const family = await Family.findById(familyId);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
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

    // Check if preferences already exist
    const existingPreferences = await NotificationPreferences.findOne({
      user: session.user.id,
      family: familyId,
    });

    if (existingPreferences) {
      return NextResponse.json(
        { error: "Notification preferences already exist for this family" },
        { status: 409 },
      );
    }

    // Create new preferences
    const preferences = await NotificationPreferences.create({
      user: session.user.id,
      family: familyId,
      ...preferencesData,
    });

    return NextResponse.json(preferences, { status: 201 });
  } catch (error) {
    console.error("Error creating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to create notification preferences" },
      { status: 500 },
    );
  }
}
