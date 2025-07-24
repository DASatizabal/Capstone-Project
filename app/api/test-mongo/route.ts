import { NextResponse } from 'next/server';
import clientPromise from '@/libs/mongo';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const client = await clientPromise;
    const status = client ? 1 : 0; // 1 means connected

    const statusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    return NextResponse.json({
      success: true,
      status: statusMap[status],
      mongoURI: process.env.MONGODB_URI,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to MongoDB',
      },
      { status: 500 }
    );
  }
}
