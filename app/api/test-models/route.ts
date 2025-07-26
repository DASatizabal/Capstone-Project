import { NextResponse } from "next/server";

import connectMongo from "@/libs/mongoose";
import Chore from "@/models/Chore";
import Family from "@/models/Family";
import User from "@/models/User";

export async function GET() {
  try {
    await connectMongo();

    // Get counts for each model
    const [userCount, familyCount, choreCount] = await Promise.all([
      User.countDocuments(),
      Family.countDocuments(),
      Chore.countDocuments(),
    ]);

    // Get sample data (first 5 records of each)
    const [users, families, chores] = await Promise.all([
      User.find().limit(5).lean(),
      Family.find().limit(5).populate("createdBy", "name email").lean(),
      Chore.find().limit(5).populate("assignedBy", "name").lean(),
    ]);

    return NextResponse.json({
      counts: {
        users: userCount,
        families: familyCount,
        chores: choreCount,
      },
      samples: {
        users,
        families,
        chores,
      },
      status: "success",
      message: "Successfully retrieved model counts and sample data",
    });
  } catch (error: any) {
    console.error("Error in test-models route:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "An error occurred while fetching model data",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Optional: Add a POST handler to create test data
export async function POST() {
  try {
    await connectMongo();

    // This is a placeholder for test data creation
    // In a real app, you'd want to add proper validation and error handling
    return NextResponse.json({
      status: "success",
      message: "Test data creation endpoint",
      note: "Implement test data creation logic here",
    });
  } catch (error: any) {
    console.error("Error in test-models POST:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "An error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
