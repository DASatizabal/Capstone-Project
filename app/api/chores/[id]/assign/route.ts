import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Chore from "@/models/Chore";
import Family from "@/models/Family";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/chores/[id]/assign - Assign or reassign a chore
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignedTo, notifyUser = true } = await req.json();

    if (!assignedTo) {
      return NextResponse.json(
        { error: "assignedTo user ID is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    // Verify user has permission to assign chores
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

    // Check permissions - parents, guardians can assign, children can self-assign unassigned chores
    const isParentOrGuardian = ["parent", "guardian"].includes(userMember.role);
    const isSelfAssigning = assignedTo === session.user.id && !chore.assignedTo;

    if (!isParentOrGuardian && !isSelfAssigning) {
      return NextResponse.json(
        { error: "Insufficient permissions to assign this chore" },
        { status: 403 },
      );
    }

    // Verify assignee is a family member
    const assigneeMember = family.members.find(
      (m: any) => m.user.toString() === assignedTo,
    );

    if (!assigneeMember) {
      return NextResponse.json(
        { error: "Assigned user is not a member of this family" },
        { status: 400 },
      );
    }

    // Store previous assignee for history
    const previousAssignee = chore.assignedTo;

    // Update assignment
    chore.assignedTo = new Types.ObjectId(assignedTo);
    chore.assignedAt = new Date();

    // Reset status if reassigning a completed/verified chore
    if (["completed", "verified"].includes(chore.status)) {
      chore.status = "pending";
      chore.completedAt = undefined;
      chore.completedBy = undefined;
      chore.verifiedAt = undefined;
      chore.verifiedBy = undefined;
      // @ts-ignore - photoVerification might not be in the model
      if (chore.photoVerification) {
        // @ts-ignore
        chore.photoVerification = [];
      }
    }

    // Add history entry
    chore.history.push({
      action: previousAssignee ? "reassigned" : "assigned",
      timestamp: new Date(),
      user: new Types.ObjectId(session.user.id),
      details: {
        from: previousAssignee,
        to: assignedTo,
      },
    });

    await chore.save();

    // Get populated chore for response
    const updatedChore = await Chore.findById(chore._id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .populate("family", "name");

    // TODO: Send notification to assigned user
    if (notifyUser) {
      // await sendNotification(assignedTo, 'chore_assigned', {
      //   choreId: chore._id,
      //   choreTitle: chore.title,
      //   assignedBy: session.user.name,
      //   dueDate: chore.dueDate
      // });
    }

    return NextResponse.json({
      message: "Chore assigned successfully",
      chore: updatedChore,
    });
  } catch (error) {
    console.error("Error assigning chore:", error);
    return NextResponse.json(
      { error: "Failed to assign chore" },
      { status: 500 },
    );
  }
}

// DELETE /api/chores/[id]/assign - Unassign a chore
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    // Verify user has permission to unassign chores
    const family = await Family.findById(chore.family);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember || !["parent", "guardian"].includes(userMember.role)) {
      return NextResponse.json(
        { error: "Only parents and guardians can unassign chores" },
        { status: 403 },
      );
    }

    const previousAssignee = chore.assignedTo;

    // Unassign the chore
    chore.assignedTo = undefined;
    chore.assignedAt = undefined;
    chore.status = "pending";

    // Add history entry
    chore.history.push({
      action: "unassigned",
      timestamp: new Date(),
      user: new Types.ObjectId(session.user.id),
      details: {
        previousAssignee,
      },
    });

    await chore.save();

    // Get populated chore for response
    const updatedChore = await Chore.findById(chore._id)
      .populate("createdBy", "name email")
      .populate("family", "name");

    return NextResponse.json({
      message: "Chore unassigned successfully",
      chore: updatedChore,
    });
  } catch (error) {
    console.error("Error unassigning chore:", error);
    return NextResponse.json(
      { error: "Failed to unassign chore" },
      { status: 500 },
    );
  }
}
