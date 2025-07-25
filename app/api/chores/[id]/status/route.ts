import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Chore from '@/models/Chore';
import Family from '@/models/Family';
import { Types } from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/chores/[id]/status - Update chore status
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes, photoUrl } = await req.json();

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'verified', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    await dbConnect();

    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user has permission to update status
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

    const isParentOrGuardian = ['parent', 'guardian'].includes(userMember.role);
    const isAssignedUser = chore.assignedTo?.toString() === session.user.id;

    // Define valid status transitions based on role
    const validTransitions: Record<string, { 
      allowed: string[], 
      requiresRole?: string[]
    }> = {
      pending: {
        allowed: ['in_progress', 'cancelled'],
        requiresRole: ['parent', 'guardian']
      },
      in_progress: {
        allowed: ['completed', 'pending', 'cancelled'],
        requiresRole: status === 'cancelled' ? ['parent', 'guardian'] : undefined
      },
      completed: {
        allowed: ['verified', 'in_progress'],
        requiresRole: status === 'verified' ? ['parent', 'guardian'] : undefined
      },
      verified: {
        allowed: [],
        requiresRole: []
      },
      cancelled: {
        allowed: ['pending'],
        requiresRole: ['parent', 'guardian']
      }
    };

    // Check if transition is valid
    const currentStatus = chore.status;
    const transition = validTransitions[currentStatus];
    
    if (!transition.allowed.includes(status)) {
      return NextResponse.json(
        { 
          error: `Cannot transition from ${currentStatus} to ${status}`,
          validTransitions: transition.allowed
        },
        { status: 400 }
      );
    }

    // Check role requirements
    if (transition.requiresRole && transition.requiresRole.length > 0) {
      const hasRequiredRole = transition.requiresRole.includes(userMember.role);
      if (!hasRequiredRole) {
        return NextResponse.json(
          { 
            error: `Only ${transition.requiresRole.join(' or ')} can make this status change`,
            requiresRole: transition.requiresRole
          },
          { status: 403 }
        );
      }
    }

    // Additional permission checks
    if (['in_progress', 'completed'].includes(status) && !isAssignedUser && !isParentOrGuardian) {
      return NextResponse.json(
        { error: 'Only assigned user or parents/guardians can update progress' },
        { status: 403 }
      );
    }

    if (status === 'verified' && !isParentOrGuardian) {
      return NextResponse.json(
        { error: 'Only parents and guardians can verify chores' },
        { status: 403 }
      );
    }

    // Update status
    const previousStatus = chore.status;
    chore.status = status;

    // Handle status-specific updates
    switch (status) {
      case 'in_progress':
        if (!chore.startedAt) {
          chore.startedAt = new Date();
        }
        break;

      case 'completed':
        chore.completedAt = new Date();
        chore.completedBy = new Types.ObjectId(session.user.id);
        
        // Add photo if provided and required
        if (photoUrl && chore.requiresPhotoVerification) {
          // @ts-ignore - photoVerification might not be in the model
          if (!chore.photoVerification) {
            // @ts-ignore
            chore.photoVerification = [];
          }
          // @ts-ignore
          chore.photoVerification.push({
            url: photoUrl,
            uploadedAt: new Date(),
            uploadedBy: new Types.ObjectId(session.user.id),
            status: 'pending'
          });
        }
        
        // Check if photo is required but not provided
        if (chore.requiresPhotoVerification && !photoUrl && (!chore.photoVerification || chore.photoVerification.length === 0)) {
          return NextResponse.json(
            { error: 'Photo verification is required for this chore' },
            { status: 400 }
          );
        }
        break;

      case 'verified':
        chore.verifiedAt = new Date();
        chore.verifiedBy = new Types.ObjectId(session.user.id);
        
        // Mark photo as approved if exists
        // @ts-ignore
        if (chore.photoVerification && chore.photoVerification.length > 0) {
          // @ts-ignore
          const latestPhoto = chore.photoVerification[chore.photoVerification.length - 1];
          latestPhoto.status = 'approved';
          latestPhoto.reviewedAt = new Date();
          latestPhoto.reviewedBy = new Types.ObjectId(session.user.id);
        }
        break;

      case 'cancelled':
        chore.cancelledAt = new Date();
        chore.cancelledBy = new Types.ObjectId(session.user.id);
        break;

      case 'pending':
        // Reset progress fields when moving back to pending
        chore.startedAt = undefined;
        chore.completedAt = undefined;
        chore.completedBy = undefined;
        chore.verifiedAt = undefined;
        chore.verifiedBy = undefined;
        break;
    }

    // Add notes if provided
    if (notes) {
      chore.notes = notes;
    }

    // Add history entry
    chore.history.push({
      action: 'status_changed',
      timestamp: new Date(),
      user: new Types.ObjectId(session.user.id),
      details: {
        from: previousStatus,
        to: status,
        notes: notes || undefined,
        photoAdded: !!photoUrl
      }
    });

    await chore.save();

    // Return updated chore with populated fields
    const updatedChore = await Chore.findById(chore._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('family', 'name')
      .populate('verifiedBy', 'name email');

    return NextResponse.json({
      message: 'Chore status updated successfully',
      chore: updatedChore
    });
  } catch (error) {
    console.error('Error updating chore status:', error);
    return NextResponse.json(
      { error: 'Failed to update chore status' },
      { status: 500 }
    );
  }
}

// GET /api/chores/[id]/status - Get status history
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const chore = await Chore.findById(params.id)
      .populate('history.user', 'name email')
      .select('history status family');

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user has access to this chore
    const family = await Family.findById(chore.family);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }
    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id
    );

    if (!userMember) {
      return NextResponse.json(
        { error: 'You do not have access to this chore' },
        { status: 403 }
      );
    }

    // Filter and format history entries
    const statusHistory = chore.history
      .filter((entry: any) => entry.action === 'status_changed')
      .map((entry: any) => ({
        id: entry._id,
        timestamp: entry.timestamp,
        user: entry.user,
        from: entry.details?.from,
        to: entry.details?.to,
        notes: entry.details?.notes,
        photoAdded: entry.details?.photoAdded || false
      }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp);

    return NextResponse.json({
      currentStatus: chore.status,
      history: statusHistory
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}
