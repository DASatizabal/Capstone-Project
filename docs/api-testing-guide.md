# API Testing Guide

## Overview

This guide provides comprehensive testing procedures for all implemented API endpoints in the family management system. Use this guide to verify functionality, test integrations, and debug issues.

## Prerequisites

### Environment Setup
```bash
# Required environment variables
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/choreminder
NEXTAUTH_SECRET=your-secret-here
RESEND_API_KEY=re_your_resend_key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
CRON_SECRET=your-cron-secret
```

### Test Tools
- **Postman** or **Insomnia** for API testing
- **MongoDB Compass** for database verification
- **Browser** for file upload testing

### Authentication
Most endpoints require authentication. First authenticate to get session cookies:

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

## Family Management APIs

### 1. Family CRUD Operations

#### Create Family
```http
POST /api/families
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "name": "The Smith Family",
  "description": "Our happy family",
  "settings": {
    "allowChildrenToCreateChores": false,
    "requirePhotoVerification": true,
    "pointsSystem": {
      "enabled": true,
      "rewards": [
        {"points": 100, "reward": "Extra screen time"}
      ]
    }
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "family": {
    "_id": "family_id_here",
    "name": "The Smith Family",
    "description": "Our happy family",
    "members": [
      {
        "user": "user_id_here",
        "role": "parent",
        "joinedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "inviteCodes": [],
    "settings": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Families
```http
GET /api/families
Cookie: next-auth.session-token=your-session-token
```

#### Update Family
```http
PUT /api/families
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "familyId": "family_id_here",
  "name": "Updated Family Name",
  "description": "Updated description"
}
```

### 2. Family Context API

#### Get Current Family Context
```http
GET /api/families/context?familyId=family_id_here
Cookie: next-auth.session-token=your-session-token
```

#### Switch Active Family
```http
PUT /api/families/context
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "familyId": "new_family_id_here"
}
```

### 3. Family Details API

#### Get Family Details
```http
GET /api/families/[family_id]
Cookie: next-auth.session-token=your-session-token
```

#### Update Family Settings (Parents Only)
```http
PUT /api/families/[family_id]
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "name": "Updated Family Name",
  "settings": {
    "allowChildrenToCreateChores": true,
    "requirePhotoVerification": false
  }
}
```

#### Delete Family (Parents Only)
```http
DELETE /api/families/[family_id]
Cookie: next-auth.session-token=your-session-token
```

### 4. Family Invitations API

#### Create Invitation Code
```http
POST /api/families/[family_id]/invite
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "role": "child",
  "expiresIn": 24
}
```

**Expected Response:**
```json
{
  "success": true,
  "inviteCode": "ABC123DEF",
  "expiresAt": "2024-01-02T00:00:00.000Z",
  "inviteUrl": "http://localhost:3000/join/ABC123DEF"
}
```

#### Join Family with Code
```http
POST /api/families/join
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "inviteCode": "ABC123DEF"
}
```

### 5. Family Members API

#### Get Family Members
```http
GET /api/families/[family_id]/members
Cookie: next-auth.session-token=your-session-token
```

#### Update Member Role (Parents Only)
```http
PUT /api/families/[family_id]/members
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "userId": "user_id_here",
  "role": "child"
}
```

#### Remove Member (Parents Only)
```http
DELETE /api/families/[family_id]/members
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "userId": "user_id_to_remove"
}
```

## Photo Verification APIs

### 1. Photo Upload API

#### Upload Photo for Chore
```http
POST /api/chores/[chore_id]/photos
Content-Type: multipart/form-data
Cookie: next-auth.session-token=your-session-token

photo: [binary file data]
description: "Completed cleaning my room"
```

**Expected Response:**
```json
{
  "success": true,
  "photo": {
    "id": "photo_id_here",
    "url": "https://s3.amazonaws.com/bucket/photos/photo.jpg",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/photo_thumb.jpg",
    "description": "Completed cleaning my room",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  },
  "chore": {
    "_id": "chore_id_here",
    "status": "completed",
    "completedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Test File Upload Validation
```bash
# Test invalid file types
curl -X POST \
  -H "Cookie: next-auth.session-token=your-token" \
  -F "photo=@test.txt" \
  http://localhost:3000/api/chores/chore_id/photos

# Test file size limits (>10MB)
curl -X POST \
  -H "Cookie: next-auth.session-token=your-token" \
  -F "photo=@large_file.jpg" \
  http://localhost:3000/api/chores/chore_id/photos
```

### 2. Photo Verification API

#### Approve Photo (Parents Only)
```http
POST /api/chores/[chore_id]/verify
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "action": "approve",
  "photoId": "photo_id_here"
}
```

#### Reject Photo (Parents Only)
```http
POST /api/chores/[chore_id]/verify
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "action": "reject",
  "photoId": "photo_id_here",
  "reason": "Photo is blurry, please retake"
}
```

### 3. Pending Approvals API

#### Get Pending Photo Approvals (Parents Only)
```http
GET /api/families/[family_id]/pending-approvals
Cookie: next-auth.session-token=your-session-token
```

#### Bulk Approve/Reject Photos
```http
POST /api/families/[family_id]/pending-approvals
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "action": "bulk_approve",
  "photoIds": ["photo1", "photo2", "photo3"]
}
```

## Notification System APIs

### 1. Notification Preferences API

#### Get User Notification Preferences
```http
GET /api/notifications/preferences?familyId=family_id_here
Cookie: next-auth.session-token=your-session-token
```

#### Update Notification Preferences
```http
PUT /api/notifications/preferences
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "familyId": "family_id_here",
  "email": {
    "enabled": true,
    "choreAssignments": true,
    "choreReminders": true,
    "choreCompletions": false,
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

### 2. Notification Statistics API

#### Get Notification Stats
```http
GET /api/notifications/stats?familyId=family_id_here&days=30
Cookie: next-auth.session-token=your-session-token
```

**Expected Response:**
```json
{
  "summary": {
    "total": 150,
    "successful": 147,
    "failed": 3,
    "opened": 98,
    "clicked": 35,
    "deliveryRate": "98.0",
    "openRate": "66.7",
    "clickRate": "35.7"
  },
  "byType": {
    "chore_assignment": {
      "total": 45,
      "breakdown": {
        "sent": { "count": 43, "avgDeliveryTime": 1250 },
        "failed": { "count": 2, "avgDeliveryTime": null }
      }
    }
  },
  "recent": [...],
  "period": { "days": 30, "from": "...", "to": "..." }
}
```

### 3. Test Notifications API (Development Only)

#### Send Test Email
```http
POST /api/notifications/test
Content-Type: application/json
Cookie: next-auth.session-token=your-session-token

{
  "type": "chore-assignment",
  "email": "test@example.com"
}
```

### 4. Cron Job APIs

#### Process Reminders
```http
POST /api/cron/reminders
Authorization: Bearer your-cron-secret
```

#### Process Daily Digests
```http
POST /api/cron/daily-digest
Authorization: Bearer your-cron-secret
```

#### Check Cron Job Status
```http
GET /api/cron/reminders
Authorization: Bearer your-cron-secret
```

## Testing Scenarios

### 1. Family Creation Flow
1. **Create Family**: POST `/api/families`
2. **Verify Database**: Check `families` collection
3. **Generate Invite**: POST `/api/families/[id]/invite`
4. **Join Family**: POST `/api/families/join` (with different user)
5. **Check Members**: GET `/api/families/[id]/members`

### 2. Photo Verification Flow
1. **Create Chore**: (Assume chore exists with photo verification required)
2. **Upload Photo**: POST `/api/chores/[id]/photos`
3. **Verify S3 Upload**: Check AWS S3 bucket
4. **Check Pending**: GET `/api/families/[id]/pending-approvals`
5. **Approve/Reject**: POST `/api/chores/[id]/verify`
6. **Verify Notification**: Check notification logs

### 3. Notification Flow
1. **Set Preferences**: PUT `/api/notifications/preferences`
2. **Trigger Event**: (Complete chore, assign chore, etc.)
3. **Check Logs**: GET `/api/notifications/stats`
4. **Test Manually**: POST `/api/notifications/test`

## Error Testing

### 1. Authentication Errors
```http
# Test without session
GET /api/families
# Expected: 401 Unauthorized

# Test with invalid session
GET /api/families
Cookie: next-auth.session-token=invalid-token
# Expected: 401 Unauthorized
```

### 2. Permission Errors
```http
# Test child trying to delete family
DELETE /api/families/family_id
Cookie: next-auth.session-token=child-user-token
# Expected: 403 Forbidden

# Test non-member accessing family
GET /api/families/other_family_id
Cookie: next-auth.session-token=non-member-token
# Expected: 403 Forbidden
```

### 3. Validation Errors
```http
# Test invalid family creation
POST /api/families
Content-Type: application/json
Cookie: next-auth.session-token=valid-token

{
  "name": ""
}
# Expected: 400 Bad Request with validation errors
```

### 4. File Upload Errors
```http
# Test invalid file type
POST /api/chores/chore_id/photos
Content-Type: multipart/form-data
Cookie: next-auth.session-token=valid-token

photo: [text file]
# Expected: 400 Bad Request - Invalid file type

# Test file too large
POST /api/chores/chore_id/photos
Content-Type: multipart/form-data
Cookie: next-auth.session-token=valid-token

photo: [15MB file]
# Expected: 400 Bad Request - File too large
```

## Performance Testing

### 1. Bulk Operations
```http
# Test bulk photo approval
POST /api/families/family_id/pending-approvals
Content-Type: application/json
Cookie: next-auth.session-token=parent-token

{
  "action": "bulk_approve",
  "photoIds": ["id1", "id2", "id3", ...] // Test with 50+ IDs
}
```

### 2. Large Data Sets
```http
# Test notification stats with large date range
GET /api/notifications/stats?familyId=family_id&days=365
Cookie: next-auth.session-token=valid-token
```

## Integration Testing

### 1. Email Integration
1. Set up test email address
2. Configure notification preferences
3. Trigger chore assignment
4. Verify email delivery
5. Check notification logs

### 2. S3 Integration
1. Upload photo with valid credentials
2. Verify file exists in S3
3. Check file permissions
4. Test thumbnail generation
5. Verify cleanup on failure

### 3. Database Integration
1. Create test data
2. Verify indexes are used
3. Test transaction rollbacks
4. Check data consistency
5. Test concurrent operations

## Monitoring and Debugging

### 1. Database Queries
```javascript
// Check notification logs
db.notificationlogs.find({
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ createdAt: -1 });

// Check failed notifications
db.notificationlogs.find({ status: "failed" });

// Check family member counts
db.families.aggregate([
  { $project: { name: 1, memberCount: { $size: "$members" } } }
]);
```

### 2. Application Logs
```bash
# Monitor API logs
tail -f .next/standalone/.next/server.log

# Check notification service logs
grep "notification" .next/standalone/.next/server.log

# Monitor S3 upload logs
grep "S3" .next/standalone/.next/server.log
```

### 3. Performance Metrics
```http
# Get API response times
GET /api/notifications/stats
# Monitor: Response time should be < 500ms

# Check database query performance
GET /api/families/family_id/members
# Monitor: Response time should be < 200ms
```

## Common Issues and Solutions

### 1. Email Not Sending
- Check RESEND_API_KEY configuration
- Verify domain authentication in Resend
- Check notification preferences are enabled
- Review error logs in NotificationLog collection

### 2. Photo Upload Failing
- Verify AWS credentials and permissions
- Check S3 bucket policy and CORS
- Validate file type and size limits
- Monitor network connectivity

### 3. Permission Denied Errors
- Verify user session is valid
- Check family membership
- Confirm user role permissions
- Review family access control logic

### 4. Database Connection Issues
- Check MONGODB_URI configuration
- Verify database connectivity
- Monitor connection pool usage
- Check for index optimization

## Test Data Cleanup

### 1. Reset Test Database
```javascript
// Remove test families
db.families.deleteMany({ name: /test/i });

// Remove test notifications
db.notificationlogs.deleteMany({ 
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
});

// Remove test photos from S3
aws s3 rm s3://your-bucket/photos/test/ --recursive
```

### 2. Reset User State
```javascript
// Clear user family associations
db.users.updateMany(
  { email: /test/i },
  { $unset: { familyId: 1 } }
);
```

This testing guide provides comprehensive coverage for all implemented APIs. Use it systematically to verify functionality and identify issues during development and deployment.