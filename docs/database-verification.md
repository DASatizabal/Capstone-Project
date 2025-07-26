# Database Verification Guide

## Overview

This guide provides MongoDB queries and verification procedures to ensure data integrity and proper functionality of all implemented features.

## Prerequisites

### MongoDB Access
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/choreminder"

# Or using MongoDB Compass
# Connection string: mongodb://localhost:27017/choreminder
```

## Collection Overview

### Core Collections
- `users` - User accounts and authentication
- `families` - Family groups and settings
- `chores` - Chore assignments and completion
- `notificationlogs` - Notification tracking
- `notificationpreferences` - User notification settings

## Verification Queries

### 1. Family Management Verification

#### Check Family Creation
```javascript
// Verify family was created with correct structure
db.families.findOne({}, {
  name: 1,
  members: 1,
  settings: 1,
  inviteCodes: 1,
  createdAt: 1
});

// Expected structure:
{
  "_id": ObjectId("..."),
  "name": "Family Name",
  "members": [
    {
      "user": ObjectId("user_id"),
      "role": "parent",
      "joinedAt": ISODate("...")
    }
  ],
  "settings": {
    "allowChildrenToCreateChores": false,
    "requirePhotoVerification": true,
    "pointsSystem": {
      "enabled": true,
      "rewards": [...]
    }
  },
  "inviteCodes": [],
  "createdAt": ISODate("...")
}
```

#### Verify Family Member Management
```javascript
// Check family member roles and permissions
db.families.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "members.user",
      foreignField: "_id",
      as: "memberDetails"
    }
  },
  {
    $project: {
      name: 1,
      members: {
        $map: {
          input: "$members",
          as: "member",
          in: {
            role: "$$member.role",
            joinedAt: "$$member.joinedAt",
            user: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$memberDetails",
                    cond: { $eq: ["$$this._id", "$$member.user"] }
                  }
                },
                0
              ]
            }
          }
        }
      }
    }
  }
]);
```

#### Check Invite Code System
```javascript
// Verify invite codes are generated and managed correctly
db.families.find(
  { "inviteCodes.0": { $exists: true } },
  { 
    name: 1, 
    "inviteCodes.code": 1, 
    "inviteCodes.role": 1, 
    "inviteCodes.expiresAt": 1,
    "inviteCodes.createdAt": 1
  }
);

// Check for expired invite codes
db.families.find({
  "inviteCodes.expiresAt": { $lt: new Date() }
});
```

#### Verify User Family Association
```javascript
// Check that users are properly linked to families
db.users.aggregate([
  {
    $lookup: {
      from: "families",
      localField: "familyId",
      foreignField: "_id",
      as: "family"
    }
  },
  {
    $project: {
      name: 1,
      email: 1,
      familyId: 1,
      familyName: { $arrayElemAt: ["$family.name", 0] },
      isFamilyMember: {
        $in: ["$_id", { $arrayElemAt: ["$family.members.user", 0] }]
      }
    }
  }
]);
```

### 2. Photo Verification System

#### Check Photo Upload and Storage
```javascript
// Verify chores with photo verification
db.chores.find({
  requiresPhotoVerification: true,
  "photoVerification.photos.0": { $exists: true }
}, {
  title: 1,
  status: 1,
  "photoVerification.photos": 1,
  completedAt: 1
});

// Expected photo structure:
{
  "photoVerification": {
    "required": true,
    "photos": [
      {
        "_id": ObjectId("..."),
        "url": "https://s3.amazonaws.com/bucket/photos/...",
        "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/...",
        "key": "photos/family_id/chore_id/filename.jpg",
        "description": "Photo description",
        "uploadedAt": ISODate("..."),
        "status": "pending",
        "approvedAt": null,
        "rejectedAt": null,
        "rejectionReason": null
      }
    ]
  }
}
```

#### Verify Photo Approval/Rejection Workflow
```javascript
// Check approved photos
db.chores.find({
  "photoVerification.photos.status": "approved"
}, {
  title: 1,
  assignedTo: 1,
  "photoVerification.photos.status": 1,
  "photoVerification.photos.approvedAt": 1
});

// Check rejected photos
db.chores.find({
  "photoVerification.photos.status": "rejected"
}, {
  title: 1,
  assignedTo: 1,
  "photoVerification.photos.status": 1,
  "photoVerification.photos.rejectedAt": 1,
  "photoVerification.photos.rejectionReason": 1
});

// Check pending approvals by family
db.chores.aggregate([
  {
    $match: {
      "photoVerification.photos.status": "pending"
    }
  },
  {
    $lookup: {
      from: "families",
      localField: "familyId",
      foreignField: "_id",
      as: "family"
    }
  },
  {
    $group: {
      _id: "$familyId",
      familyName: { $first: { $arrayElemAt: ["$family.name", 0] } },
      pendingPhotos: { $sum: 1 },
      chores: {
        $push: {
          choreId: "$_id",
          title: "$title",
          assignedTo: "$assignedTo"
        }
      }
    }
  }
]);
```

#### Check S3 Integration Data Consistency
```javascript
// Verify photo metadata consistency
db.chores.aggregate([
  { $unwind: "$photoVerification.photos" },
  {
    $project: {
      choreTitle: "$title",
      photoId: "$photoVerification.photos._id",
      url: "$photoVerification.photos.url",
      thumbnailUrl: "$photoVerification.photos.thumbnailUrl",
      key: "$photoVerification.photos.key",
      hasUrl: { $ne: ["$photoVerification.photos.url", null] },
      hasThumbnail: { $ne: ["$photoVerification.photos.thumbnailUrl", null] },
      hasKey: { $ne: ["$photoVerification.photos.key", null] }
    }
  },
  {
    $match: {
      $or: [
        { hasUrl: false },
        { hasThumbnail: false },
        { hasKey: false }
      ]
    }
  }
]);
```

### 3. Notification System Verification

#### Check Notification Preferences
```javascript
// Verify notification preferences are set correctly
db.notificationpreferences.find({}, {
  user: 1,
  family: 1,
  email: 1,
  reminderTiming: 1,
  quietHours: 1
});

// Expected structure:
{
  "user": ObjectId("user_id"),
  "family": ObjectId("family_id"),
  "email": {
    "enabled": true,
    "choreAssignments": true,
    "choreReminders": true,
    "choreCompletions": true,
    "photoApprovals": true,
    "dailyDigest": true,
    "weeklyReport": false
  },
  "reminderTiming": {
    "firstReminder": 2,
    "secondReminder": 1,
    "finalReminder": 2,
    "dailyDigestTime": "18:00"
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "07:00",
    "timezone": "America/New_York"
  }
}
```

#### Verify Notification Logs
```javascript
// Check notification delivery status
db.notificationlogs.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      types: { $addToSet: "$type" }
    }
  },
  { $sort: { count: -1 } }
]);

// Check notification types and frequency
db.notificationlogs.aggregate([
  {
    $group: {
      _id: {
        type: "$type",
        status: "$status"
      },
      count: { $sum: 1 },
      avgDeliveryTime: {
        $avg: {
          $cond: [
            { $and: ["$sentAt", "$createdAt"] },
            { $subtract: ["$sentAt", "$createdAt"] },
            null
          ]
        }
      }
    }
  },
  { $sort: { "_id.type": 1, "_id.status": 1 } }
]);
```

#### Check Failed Notifications
```javascript
// Find failed notifications and common error patterns
db.notificationlogs.find({
  status: "failed"
}, {
  type: 1,
  recipient: 1,
  error: 1,
  createdAt: 1,
  retryCount: 1
}).sort({ createdAt: -1 });

// Group errors by type
db.notificationlogs.aggregate([
  { $match: { status: "failed" } },
  {
    $group: {
      _id: "$error.message",
      count: { $sum: 1 },
      types: { $addToSet: "$type" },
      lastOccurrence: { $max: "$createdAt" }
    }
  },
  { $sort: { count: -1 } }
]);
```

### 4. Data Integrity Checks

#### Family-User Relationship Consistency
```javascript
// Check for orphaned family references
db.users.aggregate([
  {
    $lookup: {
      from: "families",
      localField: "familyId",
      foreignField: "_id",
      as: "family"
    }
  },
  {
    $match: {
      familyId: { $ne: null },
      family: { $size: 0 }
    }
  },
  {
    $project: {
      name: 1,
      email: 1,
      familyId: 1
    }
  }
]);

// Check for users in families but not linked
db.families.aggregate([
  { $unwind: "$members" },
  {
    $lookup: {
      from: "users",
      localField: "members.user",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $match: {
      user: { $size: 0 }
    }
  }
]);
```

#### Chore-Family Relationship Consistency
```javascript
// Check for chores with invalid family references
db.chores.aggregate([
  {
    $lookup: {
      from: "families",
      localField: "familyId",
      foreignField: "_id",
      as: "family"
    }
  },
  {
    $match: {
      family: { $size: 0 }
    }
  },
  {
    $project: {
      title: 1,
      familyId: 1,
      assignedTo: 1
    }
  }
]);
```

#### Notification Log Consistency
```javascript
// Check for notification logs with invalid references
db.notificationlogs.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userDoc"
    }
  },
  {
    $match: {
      userDoc: { $size: 0 }
    }
  },
  {
    $project: {
      type: 1,
      recipient: 1,
      user: 1,
      createdAt: 1
    }
  }
]);
```

## Performance Verification

### 1. Index Usage
```javascript
// Check if indexes are being used effectively
db.families.explain("executionStats").find({ "members.user": ObjectId("user_id") });
db.chores.explain("executionStats").find({ familyId: ObjectId("family_id") });
db.notificationlogs.explain("executionStats").find({ 
  user: ObjectId("user_id"),
  createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
});
```

### 2. Query Performance
```javascript
// Check slow queries (>100ms execution time)
db.setProfilingLevel(1, { slowms: 100 });

// Review profiling results
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

### 3. Collection Statistics
```javascript
// Get collection sizes and document counts
db.stats();
db.families.stats();
db.chores.stats();
db.notificationlogs.stats();
db.notificationpreferences.stats();
```

## Data Validation Scripts

### 1. Family Data Validation
```javascript
// Validate family structure
function validateFamilies() {
  const invalidFamilies = [];
  
  db.families.find().forEach(family => {
    // Check required fields
    if (!family.name || family.name.trim() === '') {
      invalidFamilies.push({ id: family._id, issue: 'Missing name' });
    }
    
    // Check members array
    if (!family.members || !Array.isArray(family.members) || family.members.length === 0) {
      invalidFamilies.push({ id: family._id, issue: 'No members' });
    }
    
    // Check for at least one parent
    const hasParent = family.members.some(m => m.role === 'parent');
    if (!hasParent) {
      invalidFamilies.push({ id: family._id, issue: 'No parent member' });
    }
  });
  
  return invalidFamilies;
}

// Run validation
const invalidFamilies = validateFamilies();
if (invalidFamilies.length > 0) {
  print("Invalid families found:");
  printjson(invalidFamilies);
} else {
  print("All families are valid");
}
```

### 2. Photo Verification Validation
```javascript
// Validate photo verification data
function validatePhotoVerification() {
  const issues = [];
  
  db.chores.find({
    requiresPhotoVerification: true,
    "photoVerification.photos.0": { $exists: true }
  }).forEach(chore => {
    chore.photoVerification.photos.forEach(photo => {
      // Check required fields
      if (!photo.url || !photo.key) {
        issues.push({
          choreId: chore._id,
          photoId: photo._id,
          issue: 'Missing URL or key'
        });
      }
      
      // Check status consistency
      if (photo.status === 'approved' && !photo.approvedAt) {
        issues.push({
          choreId: chore._id,
          photoId: photo._id,
          issue: 'Approved but no approval date'
        });
      }
      
      if (photo.status === 'rejected' && !photo.rejectedAt) {
        issues.push({
          choreId: chore._id,
          photoId: photo._id,
          issue: 'Rejected but no rejection date'
        });
      }
    });
  });
  
  return issues;
}

// Run validation
const photoIssues = validatePhotoVerification();
if (photoIssues.length > 0) {
  print("Photo verification issues found:");
  printjson(photoIssues);
} else {
  print("All photo verification data is valid");
}
```

## Cleanup and Maintenance

### 1. Remove Old Notification Logs
```javascript
// Remove logs older than 90 days (if TTL index is not set)
const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
db.notificationlogs.deleteMany({ createdAt: { $lt: oldDate } });
```

### 2. Clean Up Expired Invite Codes
```javascript
// Remove expired invite codes
db.families.updateMany(
  {},
  {
    $pull: {
      inviteCodes: {
        expiresAt: { $lt: new Date() }
      }
    }
  }
);
```

### 3. Archive Completed Chores
```javascript
// Find old completed chores (optional archival)
const archiveDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
db.chores.find({
  status: "completed",
  completedAt: { $lt: archiveDate }
}).count();
```

## Regular Health Checks

### 1. Daily Checks
```javascript
// Check for failed notifications in last 24 hours
db.notificationlogs.find({
  status: "failed",
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).count();

// Check for pending photo approvals
db.chores.find({
  "photoVerification.photos.status": "pending"
}).count();
```

### 2. Weekly Checks
```javascript
// Check notification delivery rates
db.notificationlogs.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      successful: {
        $sum: { $cond: [{ $in: ["$status", ["sent", "opened", "clicked"]] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      total: 1,
      successful: 1,
      deliveryRate: { $multiply: [{ $divide: ["$successful", "$total"] }, 100] }
    }
  }
]);
```

This verification guide provides comprehensive database checks to ensure all systems are functioning correctly and data integrity is maintained.