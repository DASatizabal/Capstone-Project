// app/api/families/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Family from "@/models/Family";
import User from "@/models/User";

// POST /api/families/join - Join a family using invite code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find family with this invite code
    const family = await Family.findOne({
      [`inviteInfo.${code.toUpperCase()}`]: { $exists: true },
    });

    if (!family) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 404 },
      );
    }

    const invitation = family.inviteInfo[code.toUpperCase()];

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 },
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Get user details
    const user = await User.findById(session.user.id);

    // Check if invitation email matches (if user exists)
    if (invitation.email && user.email !== invitation.email) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 },
      );
    }

    // Check if already a member
    const isAlreadyMember = family.members.some(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "You are already a member of this family" },
        { status: 400 },
      );
    }

    // Add user to family
    family.members.push({
      name: user.name || "Unknown",
      role: invitation.role,
      user: session.user.id,
      phone: undefined,
      age: undefined,
    });

    // Remove the used invitation
    delete family.inviteInfo[code.toUpperCase()];

    await family.save();

    // Add family to user's families array
    if (!user.families) {
      user.families = [];
    }
    user.families.push(family._id);

    // Set as active family if it's their first family
    if (user.families.length === 1) {
      user.familyId = family._id;
    }

    await user.save();

    // Return family details
    const populatedFamily = await Family.findById(family._id).populate(
      "members.user",
      "name email image",
    );

    return NextResponse.json({
      message: "Successfully joined family",
      family: {
        id: populatedFamily._id,
        name: populatedFamily.name,
        memberCount: populatedFamily.members.length,
        myRole: invitation.role,
      },
    });
  } catch (error) {
    console.error("Error joining family:", error);
    return NextResponse.json(
      { error: "Failed to join family" },
      { status: 500 },
    );
  }
}

// GET /api/families/join - Validate invite code
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find family with this invite code
    const family = await Family.findOne({
      [`inviteInfo.${code.toUpperCase()}`]: { $exists: true },
    });

    if (!family) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 404 },
      );
    }

    const invitation = family.inviteInfo[code.toUpperCase()];

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 },
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Check if user is authenticated and already a member
    const session = await getServerSession(authOptions);
    let isAlreadyMember = false;

    if (session?.user?.id) {
      isAlreadyMember = family.members.some(
        (m: any) => m.user.toString() === session.user.id,
      );
    }

    // Get inviter details
    const inviter = await User.findById(invitation.invitedBy);

    return NextResponse.json({
      valid: true,
      family: {
        name: family.name,
        memberCount: family.members.length,
      },
      invitation: {
        role: invitation.role,
        invitedBy: inviter?.name || "A family member",
        expiresAt: invitation.expiresAt,
      },
      isAlreadyMember,
      requiresAuth: !session?.user?.id,
    });
  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 },
    );
  }
}
