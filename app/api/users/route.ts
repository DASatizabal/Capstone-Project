import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the response type for better type safety
type User = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
  try {
    // Test database connection first
    await prisma.$connect();
    console.log('Database connection successful');

    // Fetch users from the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Users fetched successfully');

    // Set cache headers (adjust as needed)
    const cacheControl = process.env.NODE_ENV === 'production' 
      ? 'public, s-maxage=60, stale-while-revalidate=300'
      : 'no-store';

    return NextResponse.json(users, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}
