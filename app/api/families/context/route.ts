// app/api/families/context/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Family from "@/models/Family";
import User from "@/models/User";

// GET /api/families/context - Get current family context
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).populate({
      path: "familyId",
      populate: {
        path: "members.user",
        select: "name email image",
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If no active family, try to set one
    if (!user.familyId && user.families && user.families.length > 0) {
      user.familyId = user.families[0];
      await user.save();

      // Re-fetch with populated data
      const updatedUser = await User.findById(session.user.id).populate({
        path: "familyId",
        populate: {
          path: "members.user",
          select: "name email image",
        },
      });

      user.familyId = updatedUser.familyId;
    }

    if (!user.familyId) {
      return NextResponse.json({
        activeFamily: null,
        role: null,
        permissions: null,
        familyCount: user.families?.length || 0,
      });
    }

    // Get user's role in active family
    const userMember = user.familyId.members.find(
      (m: any) => m.user._id.toString() === session.user.id,
    );

    return NextResponse.json({
      activeFamily: {
        id: user.familyId._id,
        name: user.familyId.name,
        createdBy: user.familyId.createdBy,
        memberCount: user.familyId.members.length,
        createdAt: user.familyId.createdAt,
        updatedAt: user.familyId.updatedAt,
      },
      role: userMember?.role || "child",
      familyCount: user.families?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching family context:", error);
    return NextResponse.json(
      { error: "Failed to fetch family context" },
      { status: 500 },
    );
  }
}

// POST /api/families/context - Switch active family
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyId } = await req.json();

    if (!familyId) {
      return NextResponse.json(
        { error: "familyId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is a member of the target family
    if (
      !user.families ||
      !user.families.some((f: any) => f.toString() === familyId)
    ) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 },
      );
    }

    // Update active family
    user.familyId = familyId;
    await user.save();

    // Get the new active family details
    const family = await Family.findById(familyId).populate(
      "members.user",
      "name email image",
    );

    const userMember = family.members.find(
      (m: any) => m.user._id.toString() === session.user.id,
    );

    return NextResponse.json({
      message: "Active family switched successfully",
      activeFamily: {
        id: family._id,
        name: family.name,
        createdBy: family.createdBy,
        memberCount: family.members.length,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt,
      },
      role: userMember?.role || "child",
    });
  } catch (error) {
    console.error("Error switching family:", error);
    return NextResponse.json(
      { error: "Failed to switch family" },
      { status: 500 },
    );
  }
}
