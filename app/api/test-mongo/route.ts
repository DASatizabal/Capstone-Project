import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongo'; // This file should exist already
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectMongo(); // Connect to your MongoDB instance
    const status = mongoose.connection.readyState;

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
