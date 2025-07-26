// lib/photo-verification.ts
import { Types } from "mongoose";

import Chore from "@/models/Chore";
import Family from "@/models/Family";

export interface PhotoVerificationStatus {
  totalPhotos: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  allApproved: boolean;
  hasRejected: boolean;
}

export interface PhotoVerificationItem {
  url: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
}

// Helper function to get photo verification status for a chore
export function getPhotoVerificationStatus(
  photoVerification: PhotoVerificationItem[] = [],
): PhotoVerificationStatus {
  const totalPhotos = photoVerification.length;
  const pendingCount = photoVerification.filter(
    (p) => p.status === "pending",
  ).length;
  const approvedCount = photoVerification.filter(
    (p) => p.status === "approved",
  ).length;
  const rejectedCount = photoVerification.filter(
    (p) => p.status === "rejected",
  ).length;

  return {
    totalPhotos,
    pendingCount,
    approvedCount,
    rejectedCount,
    allApproved: totalPhotos > 0 && approvedCount === totalPhotos,
    hasRejected: rejectedCount > 0,
  };
}

// Helper function to check if user can approve photos (must be parent)
export async function canUserApprovePhotos(
  userId: string,
  familyId: string,
): Promise<boolean> {
  try {
    const family = await Family.findById(familyId);
    if (!family) return false;

    const userMember = family.members.find(
      (m: any) => m.user.toString() === userId,
    );

    return userMember?.role === "parent";
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return false;
  }
}

// Helper function to check if user is assigned to chore or family member
export async function canUserViewChore(
  userId: string,
  choreId: string,
): Promise<boolean> {
  try {
    const chore = await Chore.findById(choreId);
    if (!chore) return false;

    // User is assigned to chore
    if (chore.assignedTo?.toString() === userId) return true;

    // User is family member
    const family = await Family.findById(chore.family);
    if (!family) return false;

    return family.members.some((m: any) => m.user.toString() === userId);
  } catch (error) {
    console.error("Error checking chore access:", error);
    return false;
  }
}

// Helper function to update chore status based on photo verification
export function updateChoreStatusFromPhotos(
  chore: any,
  verificationStatus: PhotoVerificationStatus,
  verifierId?: string,
): void {
  if (verificationStatus.allApproved && verificationStatus.totalPhotos > 0) {
    chore.status = "verified";
    chore.verifiedAt = new Date();
    if (verifierId) {
      chore.verifiedBy = verifierId;
    }
  } else if (verificationStatus.hasRejected) {
    chore.status = "pending";
    chore.completedAt = undefined;
    chore.completedBy = undefined;
  }
}

// Helper function to generate photo history entry
export function createPhotoHistoryEntry(
  action:
    | "photo_uploaded"
    | "photo_approved"
    | "photo_rejected"
    | "completed_with_photo"
    | "verified",
  userId: string,
  details: any = {},
): any {
  return {
    action,
    timestamp: new Date(),
    user: userId,
    details,
  };
}

// Helper function to get pending approvals for a family
export async function getPendingApprovalsForFamily(
  familyId: string,
): Promise<any[]> {
  try {
    const chores = await Chore.find({
      family: familyId,
      requiresPhotoVerification: true,
      "photoVerification.status": "pending",
    })
      .populate("assignedTo", "name image")
      .populate("photoVerification.uploadedBy", "name image")
      .sort({ "photoVerification.uploadedAt": -1 });

    const pendingApprovals = [];

    for (const chore of chores) {
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
            assignedTo: chore.assignedTo,
          },
          pendingPhotos: pendingPhotos.map((photo: any) => {
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

    return pendingApprovals;
  } catch (error) {
    console.error("Error getting pending approvals:", error);
    return [];
  }
}

// Helper function to validate photo approval request
export function validatePhotoApprovalRequest(request: any): {
  valid: boolean;
  error?: string;
} {
  if (!request.action || !["approve", "reject"].includes(request.action)) {
    return {
      valid: false,
      error: 'Action must be either "approve" or "reject"',
    };
  }

  if (typeof request.photoIndex !== "number" || request.photoIndex < 0) {
    return { valid: false, error: "Valid photo index is required" };
  }

  if (request.action === "reject" && !request.rejectionReason?.trim()) {
    return {
      valid: false,
      error: "Rejection reason is required when rejecting",
    };
  }

  return { valid: true };
}

// Helper function to generate unique photo key for S3
export function generatePhotoKey(
  familyId: string,
  choreId: string,
  filename: string,
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = filename.split(".").pop() || "jpg";

  return `chore-photos/${familyId}/${choreId}/${timestamp}-${random}.${extension}`;
}

// Helper function to check if chore requires photo verification
export function requiresPhotoVerification(chore: any): boolean {
  return Boolean(chore.requiresPhotoVerification);
}

// Helper function to check if all required photos are uploaded and approved
export function isPhotoVerificationComplete(chore: any): boolean {
  if (!requiresPhotoVerification(chore)) return true;

  const photos = chore.photoVerification || [];
  if (photos.length === 0) return false;

  const status = getPhotoVerificationStatus(photos);
  return status.allApproved;
}

// Helper function to get photo verification summary for dashboard
export async function getPhotoVerificationSummary(familyId: string): Promise<{
  totalChoresWithPhotos: number;
  pendingApprovals: number;
  recentlyApproved: number;
  recentlyRejected: number;
}> {
  try {
    const chores = await Chore.find({
      family: familyId,
      requiresPhotoVerification: true,
    });

    let totalChoresWithPhotos = 0;
    let pendingApprovals = 0;
    let recentlyApproved = 0;
    let recentlyRejected = 0;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const chore of chores) {
      const photos = chore.photoVerification || [];

      if (photos.length > 0) {
        totalChoresWithPhotos++;

        for (const photo of photos) {
          if (photo.status === "pending") {
            pendingApprovals++;
          } else if (
            photo.status === "approved" &&
            photo.reviewedAt &&
            photo.reviewedAt > oneDayAgo
          ) {
            recentlyApproved++;
          } else if (
            photo.status === "rejected" &&
            photo.reviewedAt &&
            photo.reviewedAt > oneDayAgo
          ) {
            recentlyRejected++;
          }
        }
      }
    }

    return {
      totalChoresWithPhotos,
      pendingApprovals,
      recentlyApproved,
      recentlyRejected,
    };
  } catch (error) {
    console.error("Error getting photo verification summary:", error);
    return {
      totalChoresWithPhotos: 0,
      pendingApprovals: 0,
      recentlyApproved: 0,
      recentlyRejected: 0,
    };
  }
}
