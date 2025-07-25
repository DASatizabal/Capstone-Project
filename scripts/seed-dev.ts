import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Verify required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import Family from "@/models/Family";
import Chore from "@/models/Chore";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

console.log('🌱 Starting database seeding...');
console.log(`🔗 Using database: ${process.env.DATABASE_URL.split('@').pop()?.split('/')[1] || 'unknown'}`);

// Configuration
const CONFIG = {
  // Number of families to create
  FAMILY_COUNT: 3,
  // Min/max members per family (including at least 1 parent)
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 6,
  // Min/max chores per family
  MIN_CHORES: 2,
  MAX_CHORES: 8,
  // Admin user credentials
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD: "password123",
  // Probability of a chore being completed
  COMPLETION_RATE: 0.6,
  // Probability of a completed chore being verified
  VERIFICATION_RATE: 0.8,
};

// Helper functions
const generatePhone = () => {
  // Format: (123) 456-7890
  const areaCode = faker.string.numeric({ length: 3, allowLeadingZeros: true });
  const firstPart = faker.string.numeric({ length: 3, allowLeadingZeros: true });
  const secondPart = faker.string.numeric({ length: 4, allowLeadingZeros: true });
  return `(${areaCode}) ${firstPart}-${secondPart}`;
};

const randomDate = (daysInFuture: number) => {
  const now = new Date();
  const futureDate = new Date(now);
  // Add 1 to daysInFuture to ensure we don't get today's date
  futureDate.setDate(now.getDate() + 1 + Math.floor(Math.random() * daysInFuture));
  // Set a random time during the day
  futureDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // Between 9am and 5pm
  return futureDate;
};

const getRandomStatus = () => {
  const rand = Math.random();
  if (rand < CONFIG.COMPLETION_RATE) {
    return Math.random() < CONFIG.VERIFICATION_RATE ? 'verified' : 'completed';
  }
  return 'pending';
};

// Generate realistic chore data
const generateChore = (familyId: any, assignedTo: string, assignedBy: string) => {
  const choreTemplates = [
    { title: "Take out the trash", estimatedMinutes: 5 },
    { title: "Wash the dishes", estimatedMinutes: 15 },
    { title: "Vacuum living room", estimatedMinutes: 20 },
    { title: "Walk the dog", estimatedMinutes: 30 },
    { title: "Clean your room", estimatedMinutes: 25 },
    { title: "Do laundry", estimatedMinutes: 45 },
    { title: "Set the table", estimatedMinutes: 5 },
    { title: "Water plants", estimatedMinutes: 10 },
    { title: "Take out recycling", estimatedMinutes: 10 },
    { title: "Clean bathroom", estimatedMinutes: 30 },
    { title: "Mow the lawn", estimatedMinutes: 60 },
    { title: "Wash the car", estimatedMinutes: 45 },
  ];

  const template = faker.helpers.arrayElement(choreTemplates);
  const status = getRandomStatus();
  let completedAt: Date | undefined;
  let verifiedAt: Date | undefined;

  if (['completed', 'verified'].includes(status)) {
    // For completed/verified chores, set completion to a random time in the past 14 days
    const now = new Date();
    completedAt = new Date(now);
    completedAt.setDate(now.getDate() - Math.floor(Math.random() * 14));
    completedAt.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
    
    if (status === 'verified') {
      // Set verification to 1-3 hours after completion
      verifiedAt = new Date(completedAt.getTime() + (1 + Math.floor(Math.random() * 3)) * 60 * 60 * 1000);
    }
  }

  return {
    family: familyId,
    assignedTo,
    title: template.title,
    description: faker.lorem.sentence({ min: 5, max: 12 }),
    instructions: faker.lorem.paragraph({ min: 1, max: 3 }),
    recurrence: faker.helpers.arrayElement(["once", "daily", "weekly", "monthly"]),
    estimatedMinutes: template.estimatedMinutes,
    status,
    dueDate: randomDate(14),
    completedAt,
    verifiedAt,
    requiresParentApproval: faker.datatype.boolean({ probability: 0.7 }),
    createdBy: assignedBy,
    assignedBy,
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
  };
};

// Generate family member data
const generateMember = (isParent: boolean, userId?: string) => {
  const gender = faker.person.sex() as 'male' | 'female';
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const name = `${firstName} ${lastName}`;
  
  return {
    name,
    role: isParent ? 'parent' : 'child',
    ...(isParent && { phone: generatePhone() }),
    ...(userId && { userId }),
    ...(!isParent && { age: faker.number.int({ min: 4, max: 17 }) }),
  };
};

async function run() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectMongo();

    // Clear collections
    console.log("🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Family.deleteMany({}),
      Chore.deleteMany({}),
    ]);

    // Create admin user
    console.log("👤 Creating admin user...");
    const adminName = faker.person.fullName();
    const admin = await User.create({
      name: adminName,
      email: CONFIG.ADMIN_EMAIL,
      password: await bcrypt.hash(CONFIG.ADMIN_PASSWORD, 10),
      image: faker.image.avatar(),
      hasAccess: true,
      emailVerified: new Date(),
    });

    console.log(`\n👪 Creating ${CONFIG.FAMILY_COUNT} families...`);
    
    for (let i = 0; i < CONFIG.FAMILY_COUNT; i++) {
      const familyName = faker.person.lastName();
      console.log(`\n🏠 Creating ${familyName} family (${i + 1}/${CONFIG.FAMILY_COUNT})...`);
      
      // Create family members
      const memberCount = faker.number.int({ 
        min: CONFIG.MIN_MEMBERS, 
        max: CONFIG.MAX_MEMBERS 
      });
      
      const members = [
        generateMember(true, admin._id) // First member is always a parent
      ];

      // Add additional members (mix of parents and children)
      for (let j = 1; j < memberCount; j++) {
        const isParent = j === 1 && Math.random() > 0.7; // 30% chance of second parent
        members.push(generateMember(isParent));
      }

      // Create the family
      const family = await Family.create({
        name: `${familyName} Family`,
        createdBy: admin._id,
        members,
      });

      // Create chores for this family
      const choreCount = faker.number.int({ 
        min: CONFIG.MIN_CHORES, 
        max: CONFIG.MAX_CHORES 
      });
      
      const chores = [];
      for (let j = 0; j < choreCount; j++) {
        const assignee = faker.helpers.arrayElement(members);
        chores.push(generateChore(family._id, assignee.name, admin._id));
      }

      await Chore.insertMany(chores);
      console.log(`   ✓ Created ${chores.length} chores`);
    }

    // Create some additional users
    const additionalUsers = Array(3).fill(null).map(() => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      image: faker.image.avatar(),
      hasAccess: true,
    }));
    
    await User.insertMany(additionalUsers);

    // Final summary
    const userCount = await User.countDocuments();
    const familyCount = await Family.countDocuments();
    const choreCount = await Chore.countDocuments();

    console.log("\n✅ Seed data created successfully!");
    console.log("\n📊 Database Summary:");
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   👪 Families: ${familyCount}`);
    console.log(`   ✅ Chores: ${choreCount}`);
    
    console.log("\n🔑 Admin Login:");
    console.log(`   Email: ${CONFIG.ADMIN_EMAIL}`);
    console.log(`   Password: ${CONFIG.ADMIN_PASSWORD}`);
    console.log("\n🌐 Start the development server and log in to explore the app!");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
run();
