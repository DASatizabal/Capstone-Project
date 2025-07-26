// app/api/families/[id]/route.ts
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

// GET /api/families/[id] - Get family details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const family = await Family.findById(params.id).populate(
      "members.user",
      "name email image",
    );

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

    // Get user's role in family
    const userMember = family.members.find(
      (m: any) => m.user._id.toString() === session.user.id,
    );

    return NextResponse.json({
      family,
      myRole: userMember.role,
    });
  } catch (error) {
    console.error("Error fetching family:", error);
    return NextResponse.json(
      { error: "Failed to fetch family details" },
      { status: 500 },
    );
  }
}

// PUT /api/families/[id] - Update family details
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    await dbConnect();

    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Check if user has permission to edit family (only parents can edit)
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember || userMember.role !== "parent") {
      return NextResponse.json(
        { error: "You do not have permission to edit this family" },
        { status: 403 },
      );
    }

    // Allowed updates
    const allowedUpdates = ["name"];
    const filteredUpdates: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Validate name if provided
    if (filteredUpdates.name && filteredUpdates.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Family name must be at least 2 characters" },
        { status: 400 },
      );
    }

    // Apply updates
    Object.assign(family, filteredUpdates);
    await family.save();

    // Return updated family
    const updatedFamily = await Family.findById(family._id).populate(
      "members.user",
      "name email image",
    );

    return NextResponse.json(updatedFamily);
  } catch (error) {
    console.error("Error updating family:", error);
    return NextResponse.json(
      { error: "Failed to update family" },
      { status: 500 },
    );
  }
}

// DELETE /api/families/[id] - Delete family
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Only the family creator can delete
    if (family.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Only the family creator can delete the family" },
        { status: 403 },
      );
    }

    // Check if family has active chores
    const Chore = require("@/models/Chore").default;
    const activeChores = await Chore.countDocuments({
      family: params.id,
      status: { $nin: ["completed", "verified", "cancelled"] },
    });

    if (activeChores > 0) {
      return NextResponse.json(
        { error: "Cannot delete family with active chores" },
        { status: 400 },
      );
    }

    // Remove family from all member's families array
    await User.updateMany(
      { families: params.id },
      {
        $pull: { families: params.id },
        $unset: { familyId: params.id },
      },
    );

    // Delete the family
    await Family.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Family deleted successfully" });
  } catch (error) {
    console.error("Error deleting family:", error);
    return NextResponse.json(
      { error: "Failed to delete family" },
      { status: 500 },
    );
  }
}
