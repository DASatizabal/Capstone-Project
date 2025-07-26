// scripts/create-sample-data.js
/**
 * Sample Data Creation Script
 * 
 * This script creates realistic test data for the family management system.
 * Run with: node scripts/create-sample-data.js
 * 
 * Includes:
 * - Test families with parents and children
 * - Sample chores with various statuses
 * - Photo verification data
 * - Notification preferences and logs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Family = require('../models/Family');
const Chore = require('../models/Chore');
const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationLog = require('../models/NotificationLog');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Sample data templates
const sampleFamilies = [
  {
    name: "The Johnson Family",
    description: "A loving family of four with two energetic kids",
    settings: {
      allowChildrenToCreateChores: false,
      requirePhotoVerification: true,
      pointsSystem: {
        enabled: true,
        rewards: [
          { points: 50, reward: "Extra 30 minutes screen time" },
          { points: 100, reward: "Choose family movie night film" },
          { points: 200, reward: "$5 allowance bonus" },
          { points: 500, reward: "Special outing of choice" }
        ]
      }
    }
  },
  {
    name: "The Smith Household",
    description: "Modern family focused on teaching responsibility",
    settings: {
      allowChildrenToCreateChores: true,
      requirePhotoVerification: false,
      pointsSystem: {
        enabled: true,
        rewards: [
          { points: 25, reward: "Extra dessert" },
          { points: 75, reward: "Stay up 30 minutes late" },
          { points: 150, reward: "Friend sleepover" },
          { points: 300, reward: "New toy or book" }
        ]
      }
    }
  },
  {
    name: "The Garcia Family",
    description: "Bilingual family teaching values through chores",
    settings: {
      allowChildrenToCreateChores: false,
      requirePhotoVerification: true,
      pointsSystem: {
        enabled: false,
        rewards: []
      }
    }
  }
];

const sampleUsers = [
  // Johnson Family
  {
    name: "Michael Johnson",
    email: "michael.johnson@example.com",
    role: "parent",
    familyIndex: 0
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "parent", 
    familyIndex: 0
  },
  {
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    role: "child",
    familyIndex: 0
  },
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    role: "child",
    familyIndex: 0
  },
  
  // Smith Family
  {
    name: "David Smith",
    email: "david.smith@example.com",
    role: "parent",
    familyIndex: 1
  },
  {
    name: "Lisa Smith",
    email: "lisa.smith@example.com",
    role: "parent",
    familyIndex: 1
  },
  {
    name: "Tyler Smith",
    email: "tyler.smith@example.com",
    role: "child",
    familyIndex: 1
  },
  
  // Garcia Family
  {
    name: "Carlos Garcia",
    email: "carlos.garcia@example.com",
    role: "parent",
    familyIndex: 2
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    role: "parent",
    familyIndex: 2
  },
  {
    name: "Sofia Garcia",
    email: "sofia.garcia@example.com",
    role: "child",
    familyIndex: 2
  },
  {
    name: "Diego Garcia",
    email: "diego.garcia@example.com",
    role: "child",
    familyIndex: 2
  }
];

const sampleChores = [
  // Johnson Family Chores
  {
    title: "Clean Your Bedroom",
    description: "Make bed, organize toys, vacuum floor",
    familyIndex: 0,
    assignedToIndex: 2, // Emma
    createdByIndex: 0,  // Michael
    priority: "medium",
    points: 25,
    status: "pending",
    requiresPhotoVerification: true,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    estimatedMinutes: 30
  },
  {
    title: "Take Out Trash",
    description: "Empty all wastebaskets and take bins to curb",
    familyIndex: 0,
    assignedToIndex: 3, // Alex
    createdByIndex: 1,  // Sarah
    priority: "high",
    points: 15,
    status: "completed",
    requiresPhotoVerification: false,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedMinutes: 15
  },
  {
    title: "Feed the Dog",
    description: "Give Max his morning and evening meals",
    familyIndex: 0,
    assignedToIndex: 2, // Emma
    createdByIndex: 0,  // Michael
    priority: "high",
    points: 10,
    status: "completed",
    requiresPhotoVerification: true,
    dueDate: new Date(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    estimatedMinutes: 10,
    photoVerification: {
      required: true,
      photos: [{
        url: "https://example-bucket.s3.amazonaws.com/photos/sample-dog-feeding.jpg",
        thumbnailUrl: "https://example-bucket.s3.amazonaws.com/thumbnails/sample-dog-feeding-thumb.jpg",
        key: "photos/family1/chore1/dog-feeding.jpg",
        description: "Max eating his dinner",
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "approved",
        approvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }]
    }
  },
  
  // Smith Family Chores
  {
    title: "Load Dishwasher",
    description: "Load dirty dishes and start the cycle",
    familyIndex: 1,
    assignedToIndex: 6, // Tyler
    createdByIndex: 4,  // David
    priority: "medium",
    points: 20,
    status: "in_progress",
    requiresPhotoVerification: false,
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    estimatedMinutes: 15
  },
  {
    title: "Organize Bookshelf",
    description: "Sort books by author and dust shelves",
    familyIndex: 1,
    assignedToIndex: 6, // Tyler
    createdByIndex: 5,  // Lisa
    priority: "low",
    points: 30,
    status: "overdue",
    requiresPhotoVerification: true,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    estimatedMinutes: 45
  },
  
  // Garcia Family Chores
  {
    title: "Water the Plants",
    description: "Water all indoor and outdoor plants",
    familyIndex: 2,
    assignedToIndex: 9,  // Sofia
    createdByIndex: 7,   // Carlos
    priority: "medium",
    points: 15,
    status: "completed",
    requiresPhotoVerification: true,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    estimatedMinutes: 20,
    photoVerification: {
      required: true,
      photos: [{
        url: "https://example-bucket.s3.amazonaws.com/photos/sample-plants.jpg",
        thumbnailUrl: "https://example-bucket.s3.amazonaws.com/thumbnails/sample-plants-thumb.jpg",
        key: "photos/family3/chore1/watering-plants.jpg",
        description: "All plants watered",
        uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        status: "pending"
      }]
    }
  },
  {
    title: "Vacuum Living Room",
    description: "Vacuum carpet and around furniture",
    familyIndex: 2,
    assignedToIndex: 10, // Diego
    createdByIndex: 8,   // Maria
    priority: "medium",
    points: 25,
    status: "pending",
    requiresPhotoVerification: false,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    estimatedMinutes: 25
  }
];

// Notification preferences templates
const getNotificationPreferences = (userId, familyId, role) => ({
  user: userId,
  family: familyId,
  email: {
    enabled: true,
    choreAssignments: true,
    choreReminders: role === 'child',
    choreCompletions: role === 'parent',
    photoApprovals: true,
    dailyDigest: role === 'parent',
    weeklyReport: role === 'parent'
  },
  reminderTiming: {
    firstReminder: role === 'child' ? 2 : 1,
    secondReminder: role === 'child' ? 1 : 0,
    finalReminder: role === 'child' ? 2 : 1,
    dailyDigestTime: role === 'parent' ? "18:00" : "16:00"
  },
  quietHours: {
    enabled: true,
    startTime: "22:00",
    endTime: "07:00",
    timezone: "America/New_York"
  }
});

// Sample notification logs
const createNotificationLogs = (users, families, chores) => {
  const logs = [];
  const types = ['chore_assignment', 'chore_reminder', 'chore_completion', 'photo_approval', 'daily_digest'];
  const statuses = ['sent', 'sent', 'sent', 'opened', 'clicked', 'failed'];
  
  // Create logs for the past 30 days
  for (let day = 30; day >= 0; day--) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    
    // Create 2-5 random notifications per day
    const notificationCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < notificationCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const family = families.find(f => f.members.some(m => m.user.equals(user._id)));
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const log = {
        user: user._id,
        family: family._id,
        type,
        status,
        recipient: user.email,
        subject: `${type.replace('_', ' ')} notification`,
        createdAt: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        metadata: {
          familyName: family.name,
          priority: 'medium'
        }
      };
      
      // Add status-specific timestamps
      if (status !== 'failed') {
        log.sentAt = new Date(log.createdAt.getTime() + Math.random() * 5 * 60 * 1000);
        log.emailId = `re_${Math.random().toString(36).substring(7)}`;
      }
      
      if (status === 'opened' || status === 'clicked') {
        log.openedAt = new Date(log.sentAt.getTime() + Math.random() * 60 * 60 * 1000);
      }
      
      if (status === 'clicked') {
        log.clickedAt = new Date(log.openedAt.getTime() + Math.random() * 30 * 60 * 1000);
      }
      
      if (status === 'failed') {
        log.failedAt = log.createdAt;
        log.error = {
          message: "Invalid email address",
          code: "INVALID_EMAIL"
        };
      }
      
      logs.push(log);
    }
  }
  
  return logs;
};

// Helper function to clear existing data
async function clearExistingData() {
  console.log('🧹 Clearing existing sample data...');
  
  // Only remove sample/test data
  await User.deleteMany({ email: /@example\.com$/ });
  await Family.deleteMany({ name: /Johnson|Smith|Garcia/ });
  await Chore.deleteMany({});
  await NotificationPreferences.deleteMany({});
  await NotificationLog.deleteMany({});
  
  console.log('✅ Sample data cleared');
}

// Main data creation function
async function createSampleData() {
  try {
    console.log('🚀 Starting sample data creation...\n');
    
    // Clear existing sample data
    await clearExistingData();
    
    // Create users with hashed passwords
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        emailVerified: new Date(),
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`
      });
      
      const savedUser = await user.save();
      createdUsers.push({ ...savedUser.toObject(), role: userData.role, familyIndex: userData.familyIndex });
      console.log(`  ✅ Created user: ${userData.name}`);
    }
    
    // Create families
    console.log('\n👨‍👩‍👧‍👦 Creating families...');
    const createdFamilies = [];
    
    for (let i = 0; i < sampleFamilies.length; i++) {
      const familyData = sampleFamilies[i];
      const familyUsers = createdUsers.filter(u => u.familyIndex === i);
      
      const family = new Family({
        name: familyData.name,
        description: familyData.description,
        members: familyUsers.map(user => ({
          user: user._id,
          role: user.role,
          joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        })),
        settings: familyData.settings,
        inviteCodes: []
      });
      
      const savedFamily = await family.save();
      createdFamilies.push(savedFamily);
      
      // Update users with family ID
      for (const user of familyUsers) {
        await User.findByIdAndUpdate(user._id, { familyId: savedFamily._id });
      }
      
      console.log(`  ✅ Created family: ${familyData.name} (${familyUsers.length} members)`);
    }
    
    // Create chores
    console.log('\n📋 Creating chores...');
    const createdChores = [];
    
    for (const choreData of sampleChores) {
      const family = createdFamilies[choreData.familyIndex];
      const assignedUser = createdUsers[choreData.assignedToIndex];
      const createdByUser = createdUsers[choreData.createdByIndex];
      
      const chore = new Chore({
        title: choreData.title,
        description: choreData.description,
        familyId: family._id,
        assignedTo: assignedUser._id,
        createdBy: createdByUser._id,
        priority: choreData.priority,
        points: choreData.points,
        status: choreData.status,
        requiresPhotoVerification: choreData.requiresPhotoVerification,
        dueDate: choreData.dueDate,
        completedAt: choreData.completedAt,
        estimatedMinutes: choreData.estimatedMinutes,
        photoVerification: choreData.photoVerification || {
          required: choreData.requiresPhotoVerification,
          photos: []
        }
      });
      
      const savedChore = await chore.save();
      createdChores.push(savedChore);
      
      console.log(`  ✅ Created chore: ${choreData.title} (${choreData.status})`);
    }
    
    // Create notification preferences
    console.log('\n🔔 Creating notification preferences...');
    const createdPreferences = [];
    
    for (const family of createdFamilies) {
      for (const member of family.members) {
        const user = createdUsers.find(u => u._id.equals(member.user));
        const preferences = getNotificationPreferences(member.user, family._id, member.role);
        
        const savedPreferences = await NotificationPreferences.create(preferences);
        createdPreferences.push(savedPreferences);
        
        console.log(`  ✅ Created preferences for: ${user.name}`);
      }
    }
    
    // Create notification logs
    console.log('\n📨 Creating notification logs...');
    const notificationLogs = createNotificationLogs(createdUsers, createdFamilies, createdChores);
    const createdLogs = await NotificationLog.insertMany(notificationLogs);
    
    console.log(`  ✅ Created ${createdLogs.length} notification logs`);
    
    // Generate summary
    console.log('\n📊 Sample Data Summary:');
    console.log('========================');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`👨‍👩‍👧‍👦 Families: ${createdFamilies.length}`);
    console.log(`📋 Chores: ${createdChores.length}`);
    console.log(`🔔 Notification Preferences: ${createdPreferences.length}`);
    console.log(`📨 Notification Logs: ${createdLogs.length}`);
    
    // Print test credentials
    console.log('\n🔐 Test User Credentials:');
    console.log('==========================');
    console.log('All users have password: password123');
    console.log('');
    
    createdFamilies.forEach((family, index) => {
      console.log(`${family.name}:`);
      const familyUsers = createdUsers.filter(u => u.familyIndex === index);
      familyUsers.forEach(user => {
        console.log(`  ${user.role === 'parent' ? '👨‍👩' : '👧‍👦'} ${user.name}: ${user.email}`);
      });
      console.log('');
    });
    
    console.log('✅ Sample data creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

// Additional utility functions
async function createMinimalTestData() {
  console.log('🚀 Creating minimal test data...');
  
  const hashedPassword = await bcrypt.hash('test123', 12);
  
  // Create single test family
  const testUser = await User.create({
    name: "Test Parent",
    email: "test.parent@example.com",
    password: hashedPassword,
    emailVerified: new Date()
  });
  
  const testChild = await User.create({
    name: "Test Child",
    email: "test.child@example.com",
    password: hashedPassword,
    emailVerified: new Date()
  });
  
  const testFamily = await Family.create({
    name: "Test Family",
    description: "Family for testing purposes",
    members: [
      { user: testUser._id, role: "parent", joinedAt: new Date() },
      { user: testChild._id, role: "child", joinedAt: new Date() }
    ],
    settings: {
      allowChildrenToCreateChores: false,
      requirePhotoVerification: true,
      pointsSystem: { enabled: true, rewards: [] }
    }
  });
  
  // Update users with family ID
  await User.findByIdAndUpdate(testUser._id, { familyId: testFamily._id });
  await User.findByIdAndUpdate(testChild._id, { familyId: testFamily._id });
  
  // Create test chore
  await Chore.create({
    title: "Test Chore",
    description: "A simple test chore",
    familyId: testFamily._id,
    assignedTo: testChild._id,
    createdBy: testUser._id,
    priority: "medium",
    points: 25,
    status: "pending",
    requiresPhotoVerification: true,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    estimatedMinutes: 30
  });
  
  console.log('✅ Minimal test data created');
  console.log('📧 Parent: test.parent@example.com');
  console.log('📧 Child: test.child@example.com');
  console.log('🔑 Password: test123');
}

// CLI interface
async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'full':
        await createSampleData();
        break;
      case 'minimal':
        await createMinimalTestData();
        break;
      case 'clear':
        await clearExistingData();
        break;
      default:
        console.log('Sample Data Creation Script');
        console.log('===========================');
        console.log('Commands:');
        console.log('  node scripts/create-sample-data.js full     - Create full sample data');
        console.log('  node scripts/create-sample-data.js minimal  - Create minimal test data');
        console.log('  node scripts/create-sample-data.js clear    - Clear existing sample data');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createSampleData,
  createMinimalTestData,
  clearExistingData
};