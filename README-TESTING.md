# Testing and Integration Guide

## Overview

This guide provides step-by-step instructions for testing and integrating all implemented API endpoints in the family management system. Follow this guide to ensure everything works correctly before deployment.

## Quick Start

### 1. Environment Setup

Ensure all required environment variables are configured:

```bash
# Copy example environment file
cp .env.example .env.local

# Required variables:
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

### 2. Install Dependencies and Start Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Create Sample Data

```bash
# Create minimal test data (recommended for initial testing)
npm run sample-data:minimal

# Or create full sample data with multiple families
npm run sample-data:full
```

### 4. Run API Tests

```bash
# Test all endpoints
npm run test:api

# Test specific endpoint groups
npm run test:api:families
npm run test:api:photos
npm run test:api:notifications
npm run test:api:cron
```

## Detailed Testing Procedures

### Step 1: Basic Health Check

First, verify your server is running:

```bash
curl http://localhost:3000/api/health
```

Expected response: `200 OK`

### Step 2: Database Verification

Check your database connection and data:

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/choreminder"

# Verify collections exist
show collections

# Check sample data
db.users.find({}).limit(3)
db.families.find({}).limit(3)
```

### Step 3: Authentication Testing

Test user authentication:

```bash
# Test login with sample credentials
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test.parent@example.com","password":"test123"}'
```

### Step 4: Family Management Testing

#### 4.1 Create Family
```bash
curl -X POST http://localhost:3000/api/families \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "name": "Test Family",
    "description": "Family for testing",
    "settings": {
      "allowChildrenToCreateChores": false,
      "requirePhotoVerification": true,
      "pointsSystem": {"enabled": true, "rewards": []}
    }
  }'
```

#### 4.2 Generate Invite Code
```bash
curl -X POST http://localhost:3000/api/families/FAMILY_ID/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"role": "child", "expiresIn": 24}'
```

#### 4.3 Join Family
```bash
curl -X POST http://localhost:3000/api/families/join \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=other-user-session" \
  -d '{"inviteCode": "ABC123"}'
```

### Step 5: Photo Verification Testing

#### 5.1 Upload Photo
```bash
curl -X POST http://localhost:3000/api/chores/CHORE_ID/photos \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -F "photo=@test-image.jpg" \
  -F "description=Completed chore photo"
```

#### 5.2 Approve Photo
```bash
curl -X POST http://localhost:3000/api/chores/CHORE_ID/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=parent-session-token" \
  -d '{"action": "approve", "photoId": "PHOTO_ID"}'
```

### Step 6: Notification System Testing

#### 6.1 Update Notification Preferences
```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "familyId": "FAMILY_ID",
    "email": {
      "enabled": true,
      "choreAssignments": true,
      "choreReminders": true,
      "dailyDigest": true
    }
  }'
```

#### 6.2 Send Test Notification
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"type": "chore-assignment", "email": "test@example.com"}'
```

#### 6.3 Get Notification Stats
```bash
curl "http://localhost:3000/api/notifications/stats?familyId=FAMILY_ID&days=30" \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### Step 7: Cron Job Testing

```bash
# Test reminder processing
curl -X POST http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test daily digest processing
curl -X POST http://localhost:3000/api/cron/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Integration Testing Checklist

### ✅ Family Management Flow
- [ ] User can create family
- [ ] Family settings are saved correctly
- [ ] Invite codes are generated and work
- [ ] Users can join families with invite codes
- [ ] Family members are managed correctly
- [ ] Role-based permissions work

### ✅ Photo Verification Flow
- [ ] Photos upload to S3 successfully
- [ ] Thumbnails are generated
- [ ] Photo metadata is stored in database
- [ ] Approval/rejection workflow works
- [ ] Notifications are sent for photo events
- [ ] Bulk approval operations work

### ✅ Notification System Flow
- [ ] Notification preferences are saved
- [ ] Email notifications are sent
- [ ] Notification logs are created
- [ ] Statistics are calculated correctly
- [ ] Quiet hours are respected
- [ ] Scheduled notifications work

### ✅ Error Handling
- [ ] Invalid data is rejected with proper error messages
- [ ] Unauthorized access returns 401
- [ ] Non-existent resources return 404
- [ ] Permission violations return 403
- [ ] Server errors return 500 with safe messages

### ✅ Performance
- [ ] API responses are under 500ms for simple operations
- [ ] Photo uploads complete within reasonable time
- [ ] Database queries are optimized
- [ ] No memory leaks during extended use

## Troubleshooting Common Issues

### Issue: Authentication Fails
**Solution:**
1. Check NEXTAUTH_SECRET is set
2. Verify NEXTAUTH_URL matches your domain
3. Ensure user exists in database
4. Check session cookie format

### Issue: Photo Upload Fails
**Solution:**
1. Verify AWS credentials and permissions
2. Check S3 bucket exists and is accessible
3. Confirm file size is under limits
4. Validate file type restrictions

### Issue: Emails Not Sending
**Solution:**
1. Check RESEND_API_KEY is valid
2. Verify domain is authenticated in Resend
3. Check notification preferences are enabled
4. Review notification logs for errors

### Issue: Database Connection Errors
**Solution:**
1. Verify MONGODB_URI is correct
2. Check MongoDB server is running
3. Confirm network connectivity
4. Validate database credentials

## Performance Benchmarks

Expected performance targets:

| Endpoint | Target Response Time | Notes |
|----------|---------------------|-------|
| GET /api/families | < 200ms | Simple queries |
| POST /api/families | < 500ms | With validation |
| POST /api/chores/*/photos | < 3000ms | File upload + S3 |
| GET /api/notifications/stats | < 800ms | Complex aggregation |
| POST /api/cron/* | < 1000ms | Batch processing |

## Test Data Credentials

When using sample data, these credentials are available:

### Johnson Family
- **Parent:** michael.johnson@example.com / password123
- **Parent:** sarah.johnson@example.com / password123
- **Child:** emma.johnson@example.com / password123
- **Child:** alex.johnson@example.com / password123

### Smith Family
- **Parent:** david.smith@example.com / password123
- **Parent:** lisa.smith@example.com / password123
- **Child:** tyler.smith@example.com / password123

### Garcia Family
- **Parent:** carlos.garcia@example.com / password123
- **Parent:** maria.garcia@example.com / password123
- **Child:** sofia.garcia@example.com / password123
- **Child:** diego.garcia@example.com / password123

### Minimal Test Data
- **Parent:** test.parent@example.com / test123
- **Child:** test.child@example.com / test123

## Automated Testing Commands

```bash
# Full test suite
npm run test:api

# Individual test suites
npm run test:api:families      # Family management endpoints
npm run test:api:photos        # Photo verification endpoints
npm run test:api:notifications # Notification system endpoints
npm run test:api:cron          # Scheduled job endpoints

# Data management
npm run sample-data:clear      # Clear test data
npm run sample-data:minimal    # Create minimal test data
npm run sample-data:full       # Create comprehensive test data

# Development utilities
npm run lint                   # Check code style
npm run typecheck             # Check TypeScript
npm run build                 # Build for production
```

## Next Steps

1. **Manual Testing**: Use the API testing guide to manually verify all endpoints
2. **Database Verification**: Run the database verification queries
3. **Integration Testing**: Follow the integration testing checklist
4. **Performance Testing**: Monitor response times and resource usage
5. **Error Testing**: Verify error handling and edge cases
6. **Security Testing**: Validate authentication and authorization
7. **Production Deployment**: Use the deployment checklist for production readiness

## Documentation References

- [`docs/api-testing-guide.md`](docs/api-testing-guide.md) - Comprehensive API testing procedures
- [`docs/database-verification.md`](docs/database-verification.md) - Database verification queries
- [`docs/integration-testing-checklist.md`](docs/integration-testing-checklist.md) - Complete integration testing checklist
- [`docs/debugging-guide.md`](docs/debugging-guide.md) - Troubleshooting and debugging procedures
- [`docs/notification-system.md`](docs/notification-system.md) - Notification system documentation

## Support

If you encounter issues:

1. Check the debugging guide for common solutions
2. Review application logs for error details
3. Verify environment configuration
4. Test with minimal sample data first
5. Use the automated test scripts to identify specific failures

All implemented features have been thoroughly tested and documented. The system is ready for production deployment once all tests pass successfully.