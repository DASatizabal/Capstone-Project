import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Chore from '@/models/Chore';
import User from '@/models/User';
import Family from '@/models/Family';
import { Types } from 'mongoose';

interface RouteParams {
  params: {
    familyId: string;
  };
}

// Type for bulk assignment request body
interface BulkAssignRequest {
  choreIds: string[];
  assignedTo: string;
  notifyUsers?: boolean;
}

// GET /api/families/[familyId]/chores - Get all chores for a specific family
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify user is a member of this family
    const family = await Family.findById(params.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const isFamilyMember = family.members.some(
      (m: any) => m.user.toString() === session.user.id
    );

    if (!isFamilyMember) {
      return NextResponse.json(
        { error: 'You are not a member of this family' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const view = searchParams.get('view') || 'all'; // all, my, unassigned, overdue
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = {
      family: new Types.ObjectId(params.familyId),
      deletedAt: { $exists: false } // Soft delete check
    };

    // Apply view filters
    switch (view) {
      case 'my':
        query.assignedTo = new Types.ObjectId(session.user.id);
        break;
      case 'unassigned':
        query.assignedTo = null;
        break;
      case 'overdue':
        query.dueDate = { $lt: new Date() };
        query.status = { $in: ['pending', 'in_progress'] };
        break;
      case 'today':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: startOfDay, $lte: endOfDay };
        break;
      case 'week':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: startOfWeek, $lte: endOfWeek };
        break;
    }

    // Apply additional filters
    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'dueDate') {
      sort.dueDate = sortOrder === 'asc' ? 1 : -1;
      sort.priority = -1; // Secondary sort by priority
    } else if (sortBy === 'priority') {
      sort.priority = sortOrder === 'asc' ? 1 : -1;
      sort.dueDate = 1; // Secondary sort by due date
    } else if (sortBy === 'status') {
      sort.status = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query
    const chores = await Chore.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('completedBy', 'name email')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Chore.countDocuments(query);

    // Calculate statistics
    const stats = await Chore.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = stats.reduce((acc: Record<string, number>, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get family member statistics
    const memberStats = await Chore.aggregate([
      { $match: { ...query, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          points: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$points', 0] }
          }
        }
      }
    ]);

    // Populate member info
    const memberIds = memberStats.map((stat) => stat._id);
    const members = await User.find({ _id: { $in: memberIds } }, 'name email avatar');
    
    const memberMap = members.reduce((acc: Record<string, any>, member) => {
      acc[member._id.toString()] = member;
      return acc;
    }, {});

    const memberStatsWithInfo = memberStats.map((stat) => ({
      member: memberMap[stat._id.toString()],
      totalAssigned: stat.totalAssigned,
      completed: stat.completed,
      points: stat.points
    }));

    return NextResponse.json({
      family: {
        id: family._id,
        name: family.name
      },
      chores,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + chores.length < total
      },
      statistics: {
        total,
        byStatus: statusCounts,
        byMember: memberStatsWithInfo
      }
    });
  } catch (error) {
    console.error('Error fetching family chores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family chores' },
      { status: 500 }
    );
  }
}

// POST /api/families/[familyId]/chores - Bulk assign chores
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { choreIds, assignedTo, notifyUsers = true }: BulkAssignRequest = await req.json();

    if (!choreIds || !Array.isArray(choreIds) || choreIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one chore ID is required' },
        { status: 400 }
      );
    }

    if (!assignedTo) {
      return NextResponse.json(
        { error: 'assignedTo user ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify user has permission to assign chores
    const family = await Family.findById(params.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const userMember = family.members.find(
      (m: any) => m.user.toString() === session.user.id
    );

    if (!userMember || !['parent', 'guardian'].includes(userMember.role)) {
      return NextResponse.json(
        { error: 'Only parents and guardians can assign chores' },
        { status: 403 }
      );
    }

    // Verify assignee is a family member
    const assigneeMember = family.members.find(
      (m: any) => m.user.toString() === assignedTo
    );

    if (!assigneeMember) {
      return NextResponse.json(
        { error: 'Assigned user is not a member of this family' },
        { status: 400 }
      );
    }

    // Get all chores in a single query
    const chores = await Chore.find({
      _id: { $in: choreIds },
      family: params.familyId,
      deletedAt: { $exists: false }
    });

    if (chores.length === 0) {
      return NextResponse.json(
        { error: 'No valid chores found to assign' },
        { status: 404 }
      );
    }

    // Prepare bulk update operations
    const bulkOps = chores.map((chore) => {
      const update: any = {
        $set: {
          assignedTo: new Types.ObjectId(assignedTo),
          assignedAt: new Date(),
          status: 'pending',
          updatedAt: new Date()
        },
        $push: {
          history: {
            action: 'assigned',
            timestamp: new Date(),
            user: new Types.ObjectId(session.user.id),
            details: {
              from: chore.assignedTo,
              to: assignedTo
            }
          }
        }
      };

      // Reset completion status if needed
      if (['completed', 'verified'].includes(chore.status)) {
        update.$set.status = 'pending';
        update.$set.completedAt = null;
        update.$set.completedBy = null;
        update.$set.verifiedAt = null;
        update.$set.verifiedBy = null;
      }

      return {
        updateOne: {
          filter: { _id: chore._id },
          update: update
        }
      };
    });

    // Execute bulk update
    await Chore.bulkWrite(bulkOps);

    // Get updated chores for response
    const updatedChores = await Chore.find({
      _id: { $in: chores.map((c) => c._id) }
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    // TODO: Send notifications to assigned user
    if (notifyUsers) {
      // await sendNotification(assignedTo, 'chores_assigned', {
      //   count: updatedChores.length,
      //   assignedBy: session.user.name,
      //   familyName: family.name
      // });
    }

    return NextResponse.json({
      message: `${updatedChores.length} chores assigned successfully`,
      chores: updatedChores
    });
  } catch (error) {
    console.error('Error bulk assigning chores:', error);
    return NextResponse.json(
      { error: 'Failed to assign chores' },
      { status: 500 }
    );
  }
}
