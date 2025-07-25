import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test the connection
    await prisma.$connect();
    
    // Get database name from the connection string
    const dbName = process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'test';
    
    // Get list of all collections in the database
    const collections = await prisma.$runCommandRaw({
      listCollections: 1,
      nameOnly: true
    });
    
    // Check if users collection exists
    const usersCollectionExists = collections.cursor.firstBatch.some(
      (collection: { name: string }) => collection.name === 'users'
    );
    
    // Count documents in users collection
    const userCount = usersCollectionExists 
      ? await prisma.user.count()
      : 0;
    
    return NextResponse.json({
      success: true,
      database: dbName,
      collection: 'users',
      collectionExists: usersCollectionExists,
      userCount,
      message: usersCollectionExists 
        ? 'Successfully connected and queried users collection'
        : 'Users collection does not exist',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database operation failed',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}
