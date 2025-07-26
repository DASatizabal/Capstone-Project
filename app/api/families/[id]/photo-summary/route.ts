// app/api/families/[id]/photo-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import {
  getPhotoVerificationSummary,
  canUserApprovePhotos,
} from "@/lib/photo-verification";
import Family from "@/models/Family";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/families/[id]/photo-summary - Get photo verification summary for dashboard
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Verify user is a family member
    const family = await Family.findById(params.id);
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

    // Get photo verification summary
    const summary = await getPhotoVerificationSummary(params.id);

    // Check if user can approve photos
    const canApprove = await canUserApprovePhotos(session.user.id, params.id);

    return NextResponse.json({
      family: {
        id: family._id,
        name: family.name,
      },
      user: {
        canApprove,
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching photo summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo summary" },
      { status: 500 },
    );
  }
}
