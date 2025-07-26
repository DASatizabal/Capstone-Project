// app/api/families/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Family from "@/models/Family";
import User from "@/models/User";

// GET /api/families - Get all families for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get user with populated families
    const user = await User.findById(session.user.id).populate({
      path: "families",
      populate: {
        path: "members.user",
        select: "name email image",
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format families with user's role in each
    const familiesWithRole = (user.families || []).map((family: any) => {
      const userMember = family.members.find(
        (m: any) => m.user._id.toString() === session.user.id,
      );

      return {
        id: family._id,
        name: family.name,
        createdBy: family.createdBy,
        memberCount: family.members.length,
        myRole: userMember?.role || "child",
        createdAt: family.createdAt,
        updatedAt: family.updatedAt,
        isActive: family._id.toString() === user.familyId?.toString(),
      };
    });

    return NextResponse.json({
      families: familiesWithRole,
      activeFamily: user.familyId,
    });
  } catch (error) {
    console.error("Error fetching families:", error);
    return NextResponse.json(
      { error: "Failed to fetch families" },
      { status: 500 },
    );
  }
}

// POST /api/families - Create a new family
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Family name must be at least 2 characters" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Get current user info for the family member
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create new family with the user as parent
    const family = await Family.create({
      name: name.trim(),
      createdBy: session.user.id,
      members: [
        {
          name: currentUser.name || "Unknown",
          role: "parent",
          user: session.user.id,
          phone: undefined,
          age: undefined,
        },
      ],
    });

    // Add family to user's families array and set as active family
    await User.findByIdAndUpdate(session.user.id, {
      $push: { families: family._id },
      $set: { familyId: family._id }, // Set as active family
    });

    // Return populated family
    const populatedFamily = await Family.findById(family._id).populate(
      "members.user",
      "name email image",
    );

    return NextResponse.json(populatedFamily, { status: 201 });
  } catch (error) {
    console.error("Error creating family:", error);
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 },
    );
  }
}

// PUT /api/families - Set active family
export async function PUT(req: NextRequest) {
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

    // Verify user is a member of the family
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.families || !user.families.includes(familyId)) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 },
      );
    }

    // Update active family
    user.familyId = familyId;
    await user.save();

    return NextResponse.json({
      message: "Active family updated",
      activeFamily: familyId,
    });
  } catch (error) {
    console.error("Error updating active family:", error);
    return NextResponse.json(
      { error: "Failed to update active family" },
      { status: 500 },
    );
  }
}
