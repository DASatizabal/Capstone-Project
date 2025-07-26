// app/api/families/[id]/invite/route.ts
import crypto from "crypto";

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

// POST /api/families/[id]/invite - Create invitation code
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role = "child" } = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    // Validate role
    const validRoles = ["parent", "child", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be parent, child, or admin" },
        { status: 400 },
      );
    }

    await dbConnect();

    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Check if user has permission to invite (only parents can invite)
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember || userMember.role !== "parent") {
      return NextResponse.json(
        { error: "You do not have permission to invite members" },
        { status: 403 },
      );
    }

    // Check if email is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isAlreadyMember = family.members.some(
        (m: any) => m.user.toString() === existingUser._id.toString(),
      );
      if (isAlreadyMember) {
        return NextResponse.json(
          { error: "This email is already a member of the family" },
          { status: 400 },
        );
      }
    }

    // Generate simple invite code
    const inviteCode = crypto.randomBytes(8).toString("hex").toUpperCase();

    // Store invite info in family (simple approach without complex schema changes)
    if (!family.inviteInfo) {
      family.inviteInfo = {};
    }

    family.inviteInfo[inviteCode] = {
      email,
      role,
      invitedBy: session.user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await family.save();

    // Get inviter details
    const inviter = await User.findById(session.user.id);

    return NextResponse.json({
      message: "Invitation created successfully",
      inviteCode,
      inviteLink: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/join-family?code=${inviteCode}`,
      inviterName: inviter?.name,
      familyName: family.name,
      instructions: `Share this code with ${email}: ${inviteCode}`,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}

// GET /api/families/[id]/invite - Get pending invitations
export async function GET(req: NextRequest, { params }: RouteParams) {
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

    // Check if user is a member
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 },
      );
    }

    // Get active invitations
    const now = new Date();
    const activeInvitations = [];

    if (family.inviteInfo) {
      for (const [code, invite] of Object.entries(family.inviteInfo)) {
        const inviteData = invite as any;
        if (new Date(inviteData.expiresAt) > now) {
          activeInvitations.push({
            code: userMember.role === "parent" ? code : "***", // Only show code to parents
            email: inviteData.email,
            role: inviteData.role,
            createdAt: inviteData.createdAt,
            expiresAt: inviteData.expiresAt,
          });
        }
      }
    }

    return NextResponse.json({
      invitations: activeInvitations,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}
