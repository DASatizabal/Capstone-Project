// app/api/chores/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Chore from '@/models/Chore';
import Family from '@/models/Family';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/chores/[id]/verify - Approve or reject photo verification
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoIndex, action, rejectionReason } = await req.json();

    // Validate input
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting' },
        { status: 400 }
      );
    }

    if (typeof photoIndex !== 'number' || photoIndex < 0) {
      return NextResponse.json(
        { error: 'Valid photo index is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get chore and verify it exists
    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user has permission to approve/reject (must be parent)
    const family = await Family.findById(chore.family);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id
    );

    if (!userMember || userMember.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can approve or reject photo verification' },
        { status: 403 }
      );
    }

    // Check if photo exists
    if (!chore.photoVerification || !chore.photoVerification[photoIndex]) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    const photo = chore.photoVerification[photoIndex];

    // Check if photo is already reviewed
    if (photo.status !== 'pending') {
      return NextResponse.json(
        { error: `Photo has already been ${photo.status}` },
        { status: 400 }
      );
    }

    // Update photo verification status
    photo.status = action === 'approve' ? 'approved' : 'rejected';
    photo.reviewedAt = new Date();
    photo.reviewedBy = session.user.id;
    
    if (action === 'reject') {
      photo.rejectionReason = rejectionReason;
    }

    // Update chore status based on verification result
    if (action === 'approve') {
      // Check if all photos are approved
      const allPhotosApproved = chore.photoVerification.every(
        (p: any) => p.status === 'approved'
      );

      if (allPhotosApproved) {
        chore.status = 'verified';
        chore.verifiedAt = new Date();
        chore.verifiedBy = session.user.id;

        // Add to history
        chore.history.push({
          action: 'verified',
          timestamp: new Date(),
          user: session.user.id,
          details: {
            photoIndex,
            allPhotosApproved: true
          }
        });
      } else {
        // Add to history for individual photo approval
        chore.history.push({
          action: 'photo_approved',
          timestamp: new Date(),
          user: session.user.id,
          details: {
            photoIndex,
            photoUrl: photo.url
          }
        });
      }
    } else {
      // Photo was rejected - set chore back to pending
      chore.status = 'pending';
      chore.rejectionReason = rejectionReason;
      chore.completedAt = undefined;
      chore.completedBy = undefined;

      // Add to history
      chore.history.push({
        action: 'photo_rejected',
        timestamp: new Date(),
        user: session.user.id,
        details: {
          photoIndex,
          photoUrl: photo.url,
          rejectionReason
        }
      });
    }

    await chore.save();

    // Get updated chore with populated data
    const updatedChore = await Chore.findById(chore._id)
      .populate('photoVerification.uploadedBy', 'name image')
      .populate('photoVerification.reviewedBy', 'name image')
      .populate('assignedTo', 'name image')
      .populate('verifiedBy', 'name image');

    return NextResponse.json({
      message: `Photo ${action}d successfully`,
      chore: {
        id: updatedChore._id,
        title: updatedChore.title,
        status: updatedChore.status,
        verifiedAt: updatedChore.verifiedAt,
        verifiedBy: updatedChore.verifiedBy,
        rejectionReason: updatedChore.rejectionReason,
        photoVerification: updatedChore.photoVerification
      }
    });
  } catch (error) {
    console.error('Error verifying photo:', error);
    return NextResponse.json(
      { error: 'Failed to verify photo' },
      { status: 500 }
    );
  }
}

// GET /api/chores/[id]/verify - Get verification status and pending reviews
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get chore with populated verification data
    const chore = await Chore.findById(params.id)
      .populate('photoVerification.uploadedBy', 'name image')
      .populate('photoVerification.reviewedBy', 'name image')
      .populate('assignedTo', 'name image')
      .populate('verifiedBy', 'name image');

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user is a family member
    const family = await Family.findById(chore.family);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id
    );

    if (!userMember) {
      return NextResponse.json(
        { error: 'You are not a member of this family' },
        { status: 403 }
      );
    }

    // Get verification statistics
    const photos = chore.photoVerification || [];
    const pendingCount = photos.filter((p: any) => p.status === 'pending').length;
    const approvedCount = photos.filter((p: any) => p.status === 'approved').length;
    const rejectedCount = photos.filter((p: any) => p.status === 'rejected').length;

    return NextResponse.json({
      chore: {
        id: chore._id,
        title: chore.title,
        status: chore.status,
        requiresPhotoVerification: chore.requiresPhotoVerification,
        assignedTo: chore.assignedTo,
        verifiedAt: chore.verifiedAt,
        verifiedBy: chore.verifiedBy,
        rejectionReason: chore.rejectionReason
      },
      verification: {
        totalPhotos: photos.length,
        pendingCount,
        approvedCount,
        rejectedCount,
        canApprove: userMember.role === 'parent',
        photos: photos.map((photo: any, index: number) => ({
          index,
          url: photo.url,
          status: photo.status,
          uploadedAt: photo.uploadedAt,
          uploadedBy: photo.uploadedBy,
          reviewedAt: photo.reviewedAt,
          reviewedBy: photo.reviewedBy,
          rejectionReason: photo.rejectionReason
        }))
      }
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}