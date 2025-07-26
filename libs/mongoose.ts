import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "@/models/User";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const connectMongo = async () => {
  const connectionString = process.env.DATABASE_URL || process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error(
      "Add the DATABASE_URL environment variable inside .env.local to use mongoose",
    );
  }

  return mongoose
    .connect(connectionString)
    .catch((e) => console.error(`Mongoose Client Error: ${e.message}`));
};

export default connectMongo;
