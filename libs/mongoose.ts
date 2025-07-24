import mongoose from "mongoose";
import dotenv from 'dotenv';
import User from "@/models/User";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
    );
  }
  return mongoose
    .connect(process.env.MONGODB_URI)
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
