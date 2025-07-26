import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Chore from "@/models/Chore";
import Family from "@/models/Family";
import User from "@/models/User";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/chores/[id] - Get a single chore
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const chore = await Chore.findById(params.id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .populate("family", "name members")
      .populate("verifiedBy", "name email")
      .populate("history.user", "name email");

    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    // Check if user has access to this chore
    const family = await Family.findById(chore.family._id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    const isFamilyMember = family.members.some(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!isFamilyMember) {
      return NextResponse.json(
        { error: "You do not have access to this chore" },
        { status: 403 },
      );
    }

    return NextResponse.json(chore);
  } catch (error) {
    console.error("Error fetching chore:", error);
    return NextResponse.json(
      { error: "Failed to fetch chore" },
      { status: 500 },
    );
  }
}

// PATCH /api/chores/[id] - Update a chore
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    await dbConnect();

    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    // Verify user has permission to update this chore
    const family = await Family.findById(chore.family);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 },
      );
    }

    // Check permissions based on role and update type
    const isParentOrGuardian = ["parent", "guardian"].includes(userMember.role);
    const isAssignedUser = chore.assignedTo?.toString() === session.user.id;

    // Validate what can be updated based on role
    const allowedUpdates: Record<string, boolean> = {
      // Parents/guardians can update everything
      title: isParentOrGuardian,
      description: isParentOrGuardian,
      assignedTo: isParentOrGuardian,
      dueDate: isParentOrGuardian,
      priority: isParentOrGuardian,
      points: isParentOrGuardian,
      requiresPhotoVerification: isParentOrGuardian,
      recurrence: isParentOrGuardian,
      instructions: isParentOrGuardian,
      category: isParentOrGuardian,

      // Assigned users can only update status and notes
      status: isParentOrGuardian || isAssignedUser,
      actualMinutes: isParentOrGuardian || isAssignedUser,
      imageUrl: isParentOrGuardian || isAssignedUser,
      rejectionReason: isParentOrGuardian,
    };

    // Filter updates to only allowed fields
    const filteredUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates[key] && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided or insufficient permissions" },
        { status: 400 },
      );
    }

    // Validate status transitions if status is being updated
    if (filteredUpdates.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ["in_progress", "cancelled"],
        in_progress: ["completed", "pending", "cancelled"],
        completed: ["verified", "in_progress"],
        verified: [], // Terminal state
        cancelled: ["pending"], // Can be reactivated
      };

      if (!validTransitions[chore.status]?.includes(filteredUpdates.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${chore.status} to ${filteredUpdates.status}`,
            validTransitions: validTransitions[chore.status] || [],
          },
          { status: 400 },
        );
      }
    }

    // Apply updates
    Object.assign(chore, filteredUpdates);

    // Add history entry
    chore.history.push({
      action: "updated",
      timestamp: new Date(),
      user: new Types.ObjectId(session.user.id),
      details: filteredUpdates,
    });

    // Special handling for completion
    if (filteredUpdates.status === "completed") {
      chore.completedAt = new Date();
      chore.completedBy = new Types.ObjectId(session.user.id);
    }

    // Special handling for verification
    if (filteredUpdates.status === "verified" && isParentOrGuardian) {
      chore.verifiedAt = new Date();
      chore.verifiedBy = new Types.ObjectId(session.user.id);
    }

    await chore.save();

    // Return updated chore with populated fields
    const updatedChore = await Chore.findById(chore._id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .populate("family", "name")
      .populate("verifiedBy", "name email");

    return NextResponse.json(updatedChore);
  } catch (error) {
    console.error("Error updating chore:", error);
    return NextResponse.json(
      { error: "Failed to update chore" },
      { status: 500 },
    );
  }
}

// DELETE /api/chores/[id] - Delete a chore
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the chore
    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    // Verify user has permission to delete
    const family = await Family.findById(chore.family);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    // Only parents/guardians can delete chores
    if (!userMember || !["parent", "guardian"].includes(userMember.role)) {
      return NextResponse.json(
        { error: "Only parents and guardians can delete chores" },
        { status: 403 },
      );
    }

    // Soft delete by setting deletedAt
    chore.deletedAt = new Date();
    await chore.save();

    return NextResponse.json({ message: "Chore deleted successfully" });
  } catch (error) {
    console.error("Error deleting chore:", error);
    return NextResponse.json(
      { error: "Failed to delete chore" },
      { status: 500 },
    );
  }
}
