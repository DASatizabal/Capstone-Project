// app/api/families/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Family from "@/models/Family";
import User from "@/models/User";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/families/[id]/members - Get all family members
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const family = await Family.findById(params.id).populate({
      path: "members.user",
      select: "name email image createdAt",
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Check if user is a member
    const isMember = family.members.some(
      (m: any) => m.user._id.toString() === session.user.id,
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 },
      );
    }

    // Get additional member statistics
    const Chore = require("@/models/Chore").default;
    const memberStats = await Promise.all(
      family.members.map(async (member: any) => {
        const stats = await Chore.aggregate([
          {
            $match: {
              family: family._id,
              assignedTo: member.user._id,
            },
          },
          {
            $group: {
              _id: null,
              totalAssigned: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] },
              },
              inProgress: {
                $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
              },
              totalPoints: {
                $sum: {
                  $cond: [{ $eq: ["$status", "verified"] }, "$points", 0],
                },
              },
            },
          },
        ]);

        return {
          ...member.toObject(),
          stats: stats[0] || {
            totalAssigned: 0,
            completed: 0,
            inProgress: 0,
            totalPoints: 0,
          },
        };
      }),
    );

    return NextResponse.json({
      familyId: family._id,
      familyName: family.name,
      members: memberStats,
    });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json(
      { error: "Failed to fetch family members" },
      { status: 500 },
    );
  }
}

// PUT /api/families/[id]/members - Update member role
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, role } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Check if user has permission to manage members (only parents)
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember || userMember.role !== "parent") {
      return NextResponse.json(
        { error: "Only parents can manage member roles" },
        { status: 403 },
      );
    }

    // Find target member
    const targetMember = family.members.find(
      (m: any) => m.user.toString() === memberId,
    );

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found in family" },
        { status: 404 },
      );
    }

    // Prevent demoting yourself if you're the only parent
    if (memberId === session.user.id && role !== "parent") {
      const parentCount = family.members.filter(
        (m: any) => m.role === "parent",
      ).length;

      if (parentCount === 1) {
        return NextResponse.json(
          { error: "Cannot demote the only parent in the family" },
          { status: 400 },
        );
      }
    }

    // Update role if provided
    if (role && ["parent", "child", "admin"].includes(role)) {
      targetMember.role = role;
    }

    await family.save();

    // Return updated family with populated members
    const updatedFamily = await Family.findById(family._id).populate(
      "members.user",
      "name email image",
    );

    return NextResponse.json({
      message: "Member updated successfully",
      member: updatedFamily.members.find(
        (m: any) => m.user._id.toString() === memberId,
      ),
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 },
    );
  }
}

// DELETE /api/families/[id]/members - Remove member from family
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Check if user has permission to remove members (only parents)
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    // Find target member
    const targetMemberIndex = family.members.findIndex(
      (m: any) => m.user.toString() === memberId,
    );

    if (targetMemberIndex === -1) {
      return NextResponse.json(
        { error: "Member not found in family" },
        { status: 404 },
      );
    }

    const targetMember = family.members[targetMemberIndex];

    // Prevent removing the last parent
    if (targetMember.role === "parent") {
      const parentCount = family.members.filter(
        (m: any) => m.role === "parent",
      ).length;

      if (parentCount === 1) {
        return NextResponse.json(
          { error: "Cannot remove the only parent from the family" },
          { status: 400 },
        );
      }
    }

    // Allow users to remove themselves or parents to remove others
    const isSelfRemoval = memberId === session.user.id;
    if (!isSelfRemoval && (!userMember || userMember.role !== "parent")) {
      return NextResponse.json(
        { error: "You can only remove yourself from the family" },
        { status: 403 },
      );
    }

    // Remove member from family
    family.members.splice(targetMemberIndex, 1);
    await family.save();

    // Remove family from user's families array
    await User.findByIdAndUpdate(memberId, {
      $pull: { families: params.id },
      $unset: { familyId: params.id },
    });

    // Reassign any active chores
    const Chore = require("@/models/Chore").default;
    await Chore.updateMany(
      {
        family: params.id,
        assignedTo: memberId,
        status: { $in: ["pending", "in_progress"] },
      },
      {
        $unset: { assignedTo: 1 },
        $push: {
          history: {
            action: "unassigned",
            timestamp: new Date(),
            user: session.user.id,
            details: { reason: "Member removed from family" },
          },
        },
      },
    );

    return NextResponse.json({
      message: isSelfRemoval
        ? "Left family successfully"
        : "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }
}
