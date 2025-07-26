// app/api/families/[id]/pending-approvals/route.ts
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

// GET /api/families/[id]/pending-approvals - Get all pending photo approvals for parents
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Verify user is a parent in this family
    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember || userMember.role !== "parent") {
      return NextResponse.json(
        { error: "Only parents can view pending approvals" },
        { status: 403 },
      );
    }

    // Get all chores with pending photo verifications
    const choresWithPendingPhotos = await Chore.find({
      family: params.id,
      requiresPhotoVerification: true,
      "photoVerification.status": "pending",
    })
      .populate("assignedTo", "name image")
      .populate("photoVerification.uploadedBy", "name image")
      .sort({ "photoVerification.uploadedAt": -1 });

    // Format the response
    const pendingApprovals = [];

    for (const chore of choresWithPendingPhotos) {
      const pendingPhotos =
        chore.photoVerification?.filter(
          (photo: any) => photo.status === "pending",
        ) || [];

      if (pendingPhotos.length > 0) {
        pendingApprovals.push({
          chore: {
            id: chore._id,
            title: chore.title,
            description: chore.description,
            status: chore.status,
            priority: chore.priority,
            points: chore.points,
            dueDate: chore.dueDate,
            completedAt: chore.completedAt,
            assignedTo: chore.assignedTo,
          },
          pendingPhotos: pendingPhotos.map((photo: any, index: number) => {
            // Find the actual index in the full photoVerification array
            const actualIndex = chore.photoVerification?.findIndex(
              (p: any) =>
                p.url === photo.url &&
                p.uploadedAt.getTime() === photo.uploadedAt.getTime(),
            );

            return {
              index: actualIndex,
              url: photo.url,
              uploadedAt: photo.uploadedAt,
              uploadedBy: photo.uploadedBy,
            };
          }),
        });
      }
    }

    // Get summary statistics
    const totalPendingPhotos = pendingApprovals.reduce(
      (sum, approval) => sum + approval.pendingPhotos.length,
      0,
    );

    return NextResponse.json({
      family: {
        id: family._id,
        name: family.name,
      },
      summary: {
        totalChoresWithPendingPhotos: pendingApprovals.length,
        totalPendingPhotos,
      },
      pendingApprovals,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending approvals" },
      { status: 500 },
    );
  }
}

// POST /api/families/[id]/pending-approvals - Bulk approve/reject multiple photos
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { approvals } = await req.json();

    // Validate input
    if (!Array.isArray(approvals) || approvals.length === 0) {
      return NextResponse.json(
        { error: "Approvals array is required" },
        { status: 400 },
      );
    }

    // Validate each approval
    for (const approval of approvals) {
      if (
        !approval.choreId ||
        !["approve", "reject"].includes(approval.action)
      ) {
        return NextResponse.json(
          { error: "Each approval must have choreId and valid action" },
          { status: 400 },
        );
      }

      if (typeof approval.photoIndex !== "number" || approval.photoIndex < 0) {
        return NextResponse.json(
          { error: "Each approval must have a valid photoIndex" },
          { status: 400 },
        );
      }

      if (approval.action === "reject" && !approval.rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required for rejected photos" },
          { status: 400 },
        );
      }
    }

    await dbConnect();

    // Verify user is a parent in this family
    const family = await Family.findById(params.id);
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id,
    );

    if (!userMember || userMember.role !== "parent") {
      return NextResponse.json(
        { error: "Only parents can approve or reject photos" },
        { status: 403 },
      );
    }

    const results = [];

    // Process each approval
    for (const approval of approvals) {
      try {
        const chore = await Chore.findOne({
          _id: approval.choreId,
          family: params.id,
        });

        if (!chore) {
          results.push({
            choreId: approval.choreId,
            photoIndex: approval.photoIndex,
            success: false,
            error: "Chore not found",
          });
          continue;
        }

        if (
          !chore.photoVerification ||
          !chore.photoVerification[approval.photoIndex]
        ) {
          results.push({
            choreId: approval.choreId,
            photoIndex: approval.photoIndex,
            success: false,
            error: "Photo not found",
          });
          continue;
        }

        const photo = chore.photoVerification[approval.photoIndex];

        if (photo.status !== "pending") {
          results.push({
            choreId: approval.choreId,
            photoIndex: approval.photoIndex,
            success: false,
            error: `Photo already ${photo.status}`,
          });
          continue;
        }

        // Update photo status
        photo.status = approval.action === "approve" ? "approved" : "rejected";
        photo.reviewedAt = new Date();
        photo.reviewedBy = session.user.id;

        if (approval.action === "reject") {
          photo.rejectionReason = approval.rejectionReason;
        }

        // Update chore status
        if (approval.action === "approve") {
          const allPhotosApproved = chore.photoVerification.every(
            (p: any) => p.status === "approved",
          );

          if (allPhotosApproved) {
            chore.status = "verified";
            chore.verifiedAt = new Date();
            chore.verifiedBy = session.user.id;
          }
        } else {
          chore.status = "pending";
          chore.rejectionReason = approval.rejectionReason;
          chore.completedAt = undefined;
          chore.completedBy = undefined;
        }

        // Add to history
        chore.history.push({
          action:
            approval.action === "approve" ? "photo_approved" : "photo_rejected",
          timestamp: new Date(),
          user: session.user.id,
          details: {
            photoIndex: approval.photoIndex,
            photoUrl: photo.url,
            ...(approval.action === "reject" && {
              rejectionReason: approval.rejectionReason,
            }),
          },
        });

        await chore.save();

        results.push({
          choreId: approval.choreId,
          photoIndex: approval.photoIndex,
          success: true,
          action: approval.action,
          newChoreStatus: chore.status,
        });
      } catch (error) {
        console.error(
          `Error processing approval for chore ${approval.choreId}:`,
          error,
        );
        results.push({
          choreId: approval.choreId,
          photoIndex: approval.photoIndex,
          success: false,
          error: "Processing failed",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${successCount} approvals successfully, ${failureCount} failed`,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error("Error processing bulk approvals:", error);
    return NextResponse.json(
      { error: "Failed to process approvals" },
      { status: 500 },
    );
  }
}
