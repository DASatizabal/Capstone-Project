import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// Create a new Prisma client instance
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test the connection
    await prisma.$connect();

    // Get database name from the connection string
    const dbName =
      process.env.DATABASE_URL?.split("/").pop()?.split("?")[0] || "test";

    // Get database stats
    const dbStats = await prisma.$runCommandRaw({
      dbStats: 1,
    });

    // Get list of all collections in the database
    const collections = await prisma.$runCommandRaw({
      listCollections: 1,
      nameOnly: true,
    });

    // Get collection names
    const collectionNames =
      (collections as any)?.cursor?.firstBatch?.map(
        (collection: { name: string }) => collection.name,
      ) || [];

    // Check if users collection exists
    const usersCollectionExists = collectionNames.includes("users");

    // Count documents in users collection
    const userCount = usersCollectionExists ? await prisma.user.count() : 0;

    // Get sample users
    const sampleUsers = usersCollectionExists
      ? await prisma.user.findMany({ take: 5 })
      : [];

    return NextResponse.json({
      success: true,
      database: {
        name: dbName,
        stats: dbStats,
        collections: collectionNames,
      },
      users: {
        count: userCount,
        sample: sampleUsers,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code || "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
