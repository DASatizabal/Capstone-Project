# Debugging Guide

## Overview

This guide provides systematic debugging procedures for common issues in the family management system. Use this to quickly identify and resolve problems during development and production.

## General Debugging Setup

### 1. Enable Debug Logging
```javascript
// Add to your API routes for detailed logging
console.log('API Request:', {
  method: req.method,
  url: req.url,
  headers: req.headers,
  body: req.body,
  timestamp: new Date().toISOString()
});
```

### 2. Database Connection Debug
```javascript
// Add to lib/dbConnect.js
console.log('MongoDB Connection Status:', {
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host,
  name: mongoose.connection.name
});
```

### 3. Environment Variables Check
```bash
# Verify all required environment variables
node -e "
const required = [
  'NEXTAUTH_URL', 'MONGODB_URI', 'NEXTAUTH_SECRET',
  'RESEND_API_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION', 'AWS_S3_BUCKET_NAME'
];
required.forEach(key => {
  console.log(\`\${key}: \${process.env[key] ? '✅ Set' : '❌ Missing'}\`);
});
"
```

## Family Management Issues

### 1. Family Creation Fails

#### Symptoms
- POST `/api/families` returns 500 error
- Family not created in database
- User not added to family members

#### Debugging Steps
```javascript
// 1. Check MongoDB connection
db.runCommand({ ping: 1 })

// 2. Verify user session
console.log('Session data:', session);

// 3. Check family validation
const family = new Family({
  name: "Test Family",
  members: [{ user: session.user.id, role: "parent" }]
});
console.log('Validation errors:', family.validateSync());

// 4. Check database write permissions
try {
  const result = await Family.create(familyData);
  console.log('Family created:', result);
} catch (error) {
  console.error('Creation failed:', error.message);
}
```

#### Common Causes & Solutions
- **Invalid session**: Verify NextAuth configuration
- **Database connection**: Check MONGODB_URI and network connectivity
- **Validation errors**: Review required fields and schema constraints
- **Permission issues**: Ensure database user has write access

### 2. Invite Code Generation Issues

#### Symptoms
- Invite codes not generated
- Codes not stored in family document
- Join process fails with "invalid code"

#### Debugging Steps
```javascript
// 1. Check invite code generation
const code = Math.random().toString(36).substring(2, 8).toUpperCase();
console.log('Generated code:', code);

// 2. Verify database update
const family = await Family.findById(familyId);
console.log('Current invite codes:', family.inviteCodes);

// 3. Check expiration logic
const expiresAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
console.log('Expiration date:', expiresAt);

// 4. Test code lookup
const familyWithCode = await Family.findOne({
  'inviteCodes.code': inviteCode,
  'inviteCodes.expiresAt': { $gt: new Date() }
});
console.log('Code lookup result:', familyWithCode);
```

#### Common Causes & Solutions
- **Duplicate codes**: Implement retry logic for code generation
- **Expiration calculation**: Verify timezone handling
- **Database update failure**: Check update query syntax
- **Code lookup issues**: Ensure proper indexing on invite codes

### 3. Family Member Management Issues

#### Symptoms
- Cannot add/remove family members
- Role updates fail
- Permission checks not working

#### Debugging Steps
```javascript
// 1. Check family membership
const family = await Family.findById(familyId);
const isMember = family.members.some(m => m.user.toString() === userId);
console.log('Is family member:', isMember);

// 2. Verify role permissions
const userMember = family.members.find(m => m.user.toString() === session.user.id);
console.log('User role:', userMember?.role);

// 3. Test member operations
try {
  // Add member
  family.members.push({ user: newUserId, role: 'child', joinedAt: new Date() });
  await family.save();
  
  // Remove member
  family.members = family.members.filter(m => m.user.toString() !== userIdToRemove);
  await family.save();
} catch (error) {
  console.error('Member operation failed:', error);
}
```

#### Common Causes & Solutions
- **ObjectId comparison**: Use `.toString()` for ID comparisons
- **Missing permissions**: Verify parent role requirements
- **Concurrent updates**: Implement optimistic locking
- **Reference integrity**: Ensure user IDs exist in User collection

## Photo Verification Issues

### 1. File Upload Failures

#### Symptoms
- Photo upload returns 500 error
- Files not appearing in S3
- Upload progress hangs

#### Debugging Steps
```javascript
// 1. Check file validation
console.log('File details:', {
  name: file.name,
  size: file.size,
  type: file.type,
  lastModified: file.lastModified
});

// 2. Verify S3 configuration
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

try {
  await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
  console.log('S3 bucket accessible');
} catch (error) {
  console.error('S3 access error:', error.message);
}

// 3. Test S3 upload directly
const uploadParams = {
  Bucket: process.env.AWS_S3_BUCKET_NAME,
  Key: 'test-upload.jpg',
  Body: fileBuffer,
  ContentType: 'image/jpeg'
};

try {
  const result = await s3.upload(uploadParams).promise();
  console.log('Direct upload success:', result.Location);
} catch (error) {
  console.error('Direct upload failed:', error);
}
```

#### Common Causes & Solutions
- **File size limits**: Check multipart/form-data parser limits
- **Invalid credentials**: Verify AWS access keys and permissions
- **CORS issues**: Configure S3 bucket CORS policy
- **Network timeouts**: Increase request timeout limits
- **File type restrictions**: Verify MIME type validation

### 2. S3 Integration Issues

#### Symptoms
- Files upload but URLs are inaccessible
- Thumbnail generation fails
- Inconsistent file paths

#### Debugging Steps
```javascript
// 1. Check S3 URL format
const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
console.log('Generated URL:', url);

// 2. Test URL accessibility
const response = await fetch(url);
console.log('URL accessible:', response.ok);

// 3. Verify S3 permissions
const s3Params = {
  Bucket: bucketName,
  Key: key
};

try {
  const headResult = await s3.headObject(s3Params).promise();
  console.log('File metadata:', headResult);
} catch (error) {
  console.error('File not accessible:', error.code);
}

// 4. Check thumbnail generation
const sharp = require('sharp');
try {
  const thumbnail = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
  console.log('Thumbnail generated successfully');
} catch (error) {
  console.error('Thumbnail generation failed:', error);
}
```

#### Common Causes & Solutions
- **Bucket policy**: Ensure public read access for photo URLs
- **Region mismatch**: Verify AWS_REGION matches bucket region
- **Key format**: Use consistent path structure (family/chore/filename)
- **Sharp library**: Ensure Sharp is properly installed and compatible

### 3. Photo Approval Workflow Issues

#### Symptoms
- Approval/rejection doesn't update photo status
- Notifications not sent after approval
- Bulk operations fail partially

#### Debugging Steps
```javascript
// 1. Check photo lookup
const chore = await Chore.findById(choreId);
const photo = chore.photoVerification.photos.id(photoId);
console.log('Photo found:', !!photo);
console.log('Current status:', photo?.status);

// 2. Verify status update
photo.status = 'approved';
photo.approvedAt = new Date();
await chore.save();
console.log('Status updated successfully');

// 3. Check parent permission
const family = await Family.findById(chore.familyId);
const userMember = family.members.find(m => m.user.toString() === session.user.id);
console.log('User is parent:', userMember?.role === 'parent');

// 4. Test notification trigger
const notificationResult = await notificationService.sendPhotoApprovalNotification({
  choreId: chore._id.toString(),
  choreTitle: chore.title,
  assignedTo: { /* user data */ },
  family: { /* family data */ },
  points: chore.points,
  photoUrl: photo.url
});
console.log('Notification result:', notificationResult);
```

#### Common Causes & Solutions
- **Photo ID mismatch**: Verify ObjectId format and existence
- **Permission validation**: Check family membership and role
- **Status transition logic**: Ensure valid status changes
- **Notification failures**: Check Resend API configuration

## Notification System Issues

### 1. Email Not Sending

#### Symptoms
- Notifications show as "failed" in logs
- No emails received by users
- Resend API errors

#### Debugging Steps
```javascript
// 1. Test Resend API directly
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

try {
  const { data, error } = await resend.emails.send({
    from: 'test@yourdomain.com',
    to: ['test@example.com'],
    subject: 'Test Email',
    html: '<p>Test content</p>'
  });
  
  if (error) {
    console.error('Resend error:', error);
  } else {
    console.log('Email sent successfully:', data);
  }
} catch (error) {
  console.error('API call failed:', error);
}

// 2. Check notification preferences
const preferences = await NotificationPreferences.findOne({
  user: userId,
  family: familyId
});
console.log('User preferences:', preferences?.email);

// 3. Verify quiet hours
const now = new Date();
const isQuietHour = checkQuietHours(now, preferences?.quietHours);
console.log('Is quiet hour:', isQuietHour);

// 4. Check notification log creation
const log = await NotificationLog.findById(logId);
console.log('Log status:', log?.status);
console.log('Error details:', log?.error);
```

#### Common Causes & Solutions
- **Invalid API key**: Verify RESEND_API_KEY in environment
- **Domain verification**: Ensure sending domain is verified in Resend
- **Rate limiting**: Check Resend API rate limits
- **Email validation**: Verify recipient email format
- **Quiet hours**: Check if notification is blocked by user preferences

### 2. Template Rendering Issues

#### Symptoms
- Emails sent but content is malformed
- Template variables not replaced
- CSS styling not applied

#### Debugging Steps
```javascript
// 1. Test template rendering
import { renderChoreAssignmentEmail } from '@/components/emails/ChoreEmails';

try {
  const html = await renderChoreAssignmentEmail({
    choreTitle: 'Test Chore',
    assignedToName: 'Test User',
    familyName: 'Test Family',
    // ... other props
  });
  console.log('Template rendered successfully');
  console.log('HTML length:', html.length);
} catch (error) {
  console.error('Template rendering failed:', error);
}

// 2. Check for missing variables
const requiredProps = [
  'choreTitle', 'assignedToName', 'familyName', 
  'points', 'choreUrl', 'appName'
];

requiredProps.forEach(prop => {
  if (!templateData[prop]) {
    console.warn(`Missing template prop: ${prop}`);
  }
});

// 3. Test email preview
// Save rendered HTML to file for browser preview
const fs = require('fs');
fs.writeFileSync('email-preview.html', html);
```

#### Common Causes & Solutions
- **Missing props**: Ensure all required template variables are provided
- **React imports**: Verify React Email dependencies are installed
- **CSS inlining**: Check if styles are properly inlined for email clients
- **Dynamic content**: Validate data types match template expectations

### 3. Notification Scheduling Issues

#### Symptoms
- Reminders not sent at expected times
- Daily digest not working
- Cron jobs failing

#### Debugging Steps
```javascript
// 1. Test cron job endpoints directly
const response = await fetch('http://localhost:3000/api/cron/reminders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
});
console.log('Cron response:', await response.json());

// 2. Check reminder timing logic
const dueDate = new Date('2024-01-01T10:00:00Z');
const now = new Date();
const hoursDiff = (dueDate - now) / (1000 * 60 * 60);
console.log('Hours until due:', hoursDiff);

// 3. Verify user preference timing
const preferences = await NotificationPreferences.findOne({ user: userId });
console.log('Reminder timing:', preferences?.reminderTiming);

// 4. Check for duplicate reminders
const existingReminder = await NotificationLog.findOne({
  user: userId,
  chore: choreId,
  type: 'chore_reminder',
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
});
console.log('Recent reminder exists:', !!existingReminder);
```

#### Common Causes & Solutions
- **CRON_SECRET mismatch**: Verify environment variable matches header
- **Timezone issues**: Ensure consistent timezone handling
- **Duplicate prevention**: Implement logic to avoid duplicate reminders
- **Date calculations**: Check reminder timing calculations

## Database Issues

### 1. Connection Problems

#### Symptoms
- "MongoNetworkError" in logs
- API endpoints timing out
- Intermittent database failures

#### Debugging Steps
```javascript
// 1. Test MongoDB connection
const mongoose = require('mongoose');

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// 2. Check connection string format
const uri = process.env.MONGODB_URI;
console.log('MongoDB URI format:', {
  hasProtocol: uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
  hasCredentials: uri.includes('@'),
  hasDatabase: uri.split('/').length > 3
});

// 3. Test connection with native driver
const { MongoClient } = require('mongodb');
try {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Native driver connection successful');
  await client.close();
} catch (error) {
  console.error('Native driver connection failed:', error);
}
```

#### Common Causes & Solutions
- **Network connectivity**: Check firewall and network access
- **Authentication**: Verify username/password in connection string
- **Connection limits**: Monitor concurrent connection usage
- **DNS resolution**: Ensure MongoDB hostname resolves correctly

### 2. Query Performance Issues

#### Symptoms
- Slow API responses
- Database timeouts
- High CPU usage

#### Debugging Steps
```javascript
// 1. Enable query profiling
db.setProfilingLevel(2); // Profile all operations
// Or
db.setProfilingLevel(1, { slowms: 100 }); // Profile slow operations only

// 2. Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5);

// 3. Analyze query execution
db.families.explain("executionStats").find({ "members.user": ObjectId("user_id") });

// 4. Check index usage
db.families.getIndexes();
db.chores.getIndexes();
db.notificationlogs.getIndexes();
```

#### Common Causes & Solutions
- **Missing indexes**: Create indexes on frequently queried fields
- **Large result sets**: Implement pagination
- **Complex aggregations**: Optimize pipeline stages
- **Outdated statistics**: Update collection statistics

### 3. Data Consistency Issues

#### Symptoms
- Orphaned references
- Inconsistent relationships
- Data integrity violations

#### Debugging Steps
```javascript
// 1. Check for orphaned family references
const orphanedUsers = await User.aggregate([
  {
    $lookup: {
      from: 'families',
      localField: 'familyId',
      foreignField: '_id',
      as: 'family'
    }
  },
  {
    $match: {
      familyId: { $ne: null },
      family: { $size: 0 }
    }
  }
]);
console.log('Orphaned user references:', orphanedUsers.length);

// 2. Verify family member consistency
const inconsistentFamilies = await Family.aggregate([
  { $unwind: '$members' },
  {
    $lookup: {
      from: 'users',
      localField: 'members.user',
      foreignField: '_id',
      as: 'user'
    }
  },
  {
    $match: {
      user: { $size: 0 }
    }
  }
]);
console.log('Inconsistent family members:', inconsistentFamilies.length);
```

#### Common Causes & Solutions
- **Incomplete transactions**: Use MongoDB transactions for multi-document operations
- **Race conditions**: Implement proper locking mechanisms
- **Manual data changes**: Avoid direct database modifications
- **Migration errors**: Verify data migration scripts

## Performance Issues

### 1. Slow API Responses

#### Symptoms
- API endpoints taking >2 seconds
- Timeout errors
- Poor user experience

#### Debugging Steps
```javascript
// 1. Add timing middleware
export async function middleware(req) {
  const start = Date.now();
  
  // Process request
  const response = await next();
  
  const duration = Date.now() - start;
  console.log(`${req.method} ${req.url}: ${duration}ms`);
  
  return response;
}

// 2. Profile specific endpoints
console.time('family-creation');
const family = await Family.create(familyData);
console.timeEnd('family-creation');

// 3. Check database query performance
const explain = await Family.find({ 'members.user': userId }).explain('executionStats');
console.log('Query execution stats:', explain.executionStats);
```

#### Common Causes & Solutions
- **Database queries**: Optimize queries and add indexes
- **External API calls**: Implement caching and async processing
- **Large payloads**: Implement response compression
- **Inefficient algorithms**: Optimize business logic

### 2. Memory Issues

#### Symptoms
- Out of memory errors
- Increasing memory usage
- Process crashes

#### Debugging Steps
```javascript
// 1. Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`
  });
}, 30000);

// 2. Check for memory leaks
global.gc && global.gc(); // Force garbage collection if enabled
const usage = process.memoryUsage();
console.log('Memory after GC:', usage);

// 3. Profile large data operations
console.log('Processing large dataset...');
const results = await processLargeDataset();
console.log('Memory after processing:', process.memoryUsage());
```

#### Common Causes & Solutions
- **Memory leaks**: Check for unclosed connections and event listeners
- **Large datasets**: Implement streaming and pagination
- **Inefficient caching**: Review cache size limits and expiration
- **Circular references**: Avoid circular object references

## Security Issues

### 1. Authentication Problems

#### Symptoms
- Users can't log in
- Session management issues
- Unauthorized access

#### Debugging Steps
```javascript
// 1. Check NextAuth configuration
console.log('NextAuth config:', {
  url: process.env.NEXTAUTH_URL,
  secret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
  providers: authOptions.providers.length
});

// 2. Verify session creation
const session = await getServerSession(authOptions);
console.log('Session data:', session);

// 3. Check JWT token
const token = jwt.decode(sessionToken);
console.log('JWT payload:', token);
```

#### Common Causes & Solutions
- **Missing NEXTAUTH_SECRET**: Set secure random secret
- **URL mismatch**: Ensure NEXTAUTH_URL matches deployment URL
- **Provider configuration**: Verify OAuth provider settings
- **Cookie issues**: Check domain and secure cookie settings

### 2. Authorization Failures

#### Symptoms
- Users accessing unauthorized data
- Permission checks failing
- Role-based access not working

#### Debugging Steps
```javascript
// 1. Check user permissions
const family = await Family.findById(familyId);
const userRole = family.members.find(m => m.user.toString() === userId)?.role;
console.log('User role in family:', userRole);

// 2. Verify access control logic
function hasPermission(userRole, requiredRole) {
  const roleHierarchy = { parent: 2, child: 1 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// 3. Test permission middleware
const hasAccess = await checkFamilyAccess(userId, familyId);
console.log('Family access granted:', hasAccess);
```

#### Common Causes & Solutions
- **Missing permission checks**: Add authorization to all protected endpoints
- **Role hierarchy errors**: Define clear role-based permissions
- **Context validation**: Verify family context for all operations
- **Session validation**: Check session validity and user status

## Production Debugging

### 1. Log Analysis

#### Application Logs
```bash
# View recent logs
tail -f /var/log/app/application.log

# Search for errors
grep "ERROR\|FATAL" /var/log/app/application.log | tail -20

# Monitor specific operations
grep "photo upload\|notification" /var/log/app/application.log
```

#### Database Logs
```bash
# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Look for slow queries
grep "slow operation" /var/log/mongodb/mongod.log
```

### 2. Performance Monitoring

#### System Metrics
```bash
# CPU and memory usage
top -p $(pgrep node)

# Disk space
df -h

# Network connections
netstat -an | grep :3000
```

#### Application Metrics
```javascript
// Add performance monitoring
const startTime = process.hrtime();
// ... operation
const [seconds, nanoseconds] = process.hrtime(startTime);
const milliseconds = seconds * 1000 + nanoseconds / 1000000;
console.log(`Operation took ${milliseconds.toFixed(2)}ms`);
```

## Quick Troubleshooting Checklist

### ✅ When APIs Return 500 Errors
1. Check application logs for error details
2. Verify database connection
3. Confirm environment variables are set
4. Test with minimal data to isolate issue

### ✅ When File Uploads Fail
1. Check file size and type restrictions
2. Verify AWS credentials and permissions
3. Test S3 connectivity directly
4. Check network and firewall settings

### ✅ When Emails Don't Send
1. Verify Resend API key and domain
2. Check notification preferences
3. Test template rendering
4. Monitor rate limits and quotas

### ✅ When Database Operations Fail
1. Check MongoDB connection string
2. Verify user permissions
3. Look for validation errors
4. Check for data consistency issues

### ✅ When Performance is Poor
1. Profile slow database queries
2. Check for memory leaks
3. Monitor external API response times
4. Verify proper indexing

This debugging guide provides systematic approaches to identify and resolve common issues. Use the appropriate section based on the symptoms you're experiencing.