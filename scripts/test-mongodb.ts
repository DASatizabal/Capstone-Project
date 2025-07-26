import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  console.log("🔌 Testing MongoDB connection...");
  console.log(`   URI: ${uri.replace(/:([^:]*?)@/, ":***@")}`); // Hide password in logs

  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

    // List all databases
    const adminDb = client.db("admin").admin();
    const dbs = await adminDb.listDatabases();
    console.log("\n📊 Available databases:");
    dbs.databases.forEach((db) => console.log(`   - ${db.name}`));
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.close();
  }
}

testConnection().catch(console.error);
