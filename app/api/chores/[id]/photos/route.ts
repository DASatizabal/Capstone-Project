// app/api/chores/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Chore from '@/models/Chore';
import Family from '@/models/Family';
import { uploadToS3 } from '@/libs/s3';
import crypto from 'crypto';

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to optimize image (basic version without sharp)
async function optimizeImage(buffer: Buffer, contentType: string): Promise<Buffer> {
  // For now, return the original buffer
  // You can add sharp integration later for proper optimization
  return buffer;
}

// POST /api/chores/[id]/photos - Upload photo for chore verification
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get chore and verify permissions
    const chore = await Chore.findById(params.id);
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user is assigned to this chore or is a family member
    const family = await Family.findById(chore.family);
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

    // Check if chore requires photo verification
    if (!chore.requiresPhotoVerification) {
      return NextResponse.json(
        { error: 'This chore does not require photo verification' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No photo file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Optimize image
    buffer = await optimizeImage(buffer, file.type);

    // Generate unique filename
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = file.name.split('.').pop() || 'jpg';
    const key = `chore-photos/${chore.family}/${chore._id}/${timestamp}-${random}.${extension}`;

    // Upload to S3
    const photoUrl = await uploadToS3({
      buffer,
      key,
      contentType: file.type,
    });

    // Initialize photoVerification array if it doesn't exist
    if (!chore.photoVerification) {
      chore.photoVerification = [];
    }

    // Add photo to chore verification
    const photoVerification = {
      url: photoUrl,
      uploadedAt: new Date(),
      uploadedBy: session.user.id,
      status: 'pending' as const,
    };

    chore.photoVerification.push(photoVerification);

    // Update chore status to completed if it's not already
    if (chore.status === 'pending' || chore.status === 'in_progress') {
      chore.status = 'completed';
      chore.completedAt = new Date();
      chore.completedBy = session.user.id;

      // Add to history
      chore.history.push({
        action: 'completed_with_photo',
        timestamp: new Date(),
        user: session.user.id,
        details: {
          photoUrl,
          previousStatus: chore.status
        }
      });
    }

    await chore.save();

    return NextResponse.json({
      message: 'Photo uploaded successfully',
      photoUrl,
      chore: {
        id: chore._id,
        status: chore.status,
        photoVerification: chore.photoVerification
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

// GET /api/chores/[id]/photos - Get all photos for a chore
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get chore and verify permissions
    const chore = await Chore.findById(params.id)
      .populate('photoVerification.uploadedBy', 'name image')
      .populate('photoVerification.reviewedBy', 'name image');

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user is a family member
    const family = await Family.findById(chore.family);
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

    return NextResponse.json({
      choreId: chore._id,
      choreTitle: chore.title,
      requiresPhotoVerification: chore.requiresPhotoVerification,
      photos: chore.photoVerification || []
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}