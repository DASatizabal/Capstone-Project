# Notification System Documentation

## Overview

The notification system provides automated email notifications for chore-related events, with comprehensive tracking, user preferences, and scheduled reminders. Built on Resend email service with React Email templates.

## Architecture

### Core Components

1. **Notification Service** (`lib/notification-service.ts`)
   - Centralized email sending with logging
   - Template rendering and delivery
   - Error handling and retry logic

2. **Email Templates** (`components/emails/ChoreEmails.tsx`)
   - React-based email templates
   - Responsive design with consistent styling
   - Dynamic content based on chore data

3. **Reminder Scheduler** (`lib/reminder-scheduler.ts`)
   - Automated reminder processing
   - Daily digest generation
   - Cron job integration

4. **Notification Preferences** (`models/NotificationPreferences.ts`)
   - User-specific notification settings
   - Timing and frequency controls
   - Quiet hours and delivery preferences

5. **Notification Logging** (`models/NotificationLog.ts`)
   - Comprehensive delivery tracking
   - Performance metrics and analytics
   - Error logging and retry management

## Notification Types

### 1. Chore Assignment
- **Trigger**: When a chore is assigned to a user
- **Recipient**: Assigned user
- **Content**: Chore details, due date, points, photo requirements
- **Template**: `ChoreAssignmentEmail`

### 2. Chore Reminders
- **Trigger**: Based on user preferences (1-2 days before, final hour)
- **Recipient**: Assigned user
- **Content**: Reminder with urgency level, time remaining
- **Template**: `ChoreReminderEmail`

### 3. Chore Completion
- **Trigger**: When a chore is marked as completed
- **Recipient**: Parents in the family
- **Content**: Completion notification, photo review if required
- **Template**: `ChoreCompletionEmail`

### 4. Photo Approval
- **Trigger**: When a parent approves a submitted photo
- **Recipient**: Child who submitted the photo
- **Content**: Approval confirmation, points earned
- **Template**: `PhotoApprovalEmail`

### 5. Photo Rejection
- **Trigger**: When a parent rejects a submitted photo
- **Recipient**: Child who submitted the photo
- **Content**: Rejection reason, instructions for resubmission
- **Template**: `PhotoRejectionEmail`

### 6. Daily Digest
- **Trigger**: Scheduled based on user preference (default 6 PM)
- **Recipient**: Parents who enabled daily digest
- **Content**: Family activity summary, completed chores, overdue items
- **Template**: Custom HTML template

## API Endpoints

### Notification Preferences

#### Get Preferences
```http
GET /api/notifications/preferences?familyId={id}
```

#### Update Preferences
```http
PUT /api/notifications/preferences
Content-Type: application/json

{
  "familyId": "family_id",
  "email": {
    "choreReminders": true,
    "dailyDigest": false
  },
  "reminderTiming": {
    "firstReminder": 2,
    "secondReminder": 1,
    "finalReminder": 2
  }
}
```

### Notification Statistics

#### Get Stats
```http
GET /api/notifications/stats?familyId={id}&days=30
```

Response:
```json
{
  "summary": {
    "total": 150,
    "successful": 147,
    "failed": 3,
    "deliveryRate": "98.0",
    "openRate": "65.3",
    "clickRate": "23.1"
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

### Test Notifications (Development Only)

#### Send Test Email
```http
POST /api/notifications/test
Content-Type: application/json

{
  "type": "chore-assignment",
  "email": "test@example.com"
}
```

### Cron Jobs

#### Process Reminders
```http
POST /api/cron/reminders
Authorization: Bearer {CRON_SECRET}
```

#### Process Daily Digests  
```http
POST /api/cron/daily-digest
Authorization: Bearer {CRON_SECRET}
```

## Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_your_api_key_here
NEXTAUTH_URL=https://yourdomain.com

# Optional
CRON_SECRET=your_cron_secret_for_scheduled_jobs
```

### Email Configuration (config.ts)

```typescript
resend: {
  fromNoReply: `ChoreMinder <noreply@yourdomain.com>`,
  fromAdmin: `ChoreMinder Family <family@yourdomain.com>`,
  supportEmail: "support@yourdomain.com",
}
```

## Notification Preferences

### Email Preferences
- **enabled**: Master email toggle
- **choreAssignments**: New chore notifications
- **choreReminders**: Due date reminders
- **choreCompletions**: Completion notifications (parents)
- **photoApprovals**: Photo approval/rejection notifications
- **dailyDigest**: Daily family summary
- **weeklyReport**: Weekly family report (future)

### Timing Preferences
- **firstReminder**: Days before due date (0-7)
- **secondReminder**: Days before due date (0-7)  
- **finalReminder**: Hours before due date (0-24)
- **dailyDigestTime**: Time for daily digest (HH:MM)
- **quietHours**: Do not disturb period

### Quiet Hours
- **enabled**: Enable quiet hours
- **startTime**: Start time (HH:MM)
- **endTime**: End time (HH:MM)
- **timezone**: User's timezone

## Scheduling & Automation

### Cron Jobs Setup

For production deployment, configure these cron jobs:

```bash
# Process reminders every hour
0 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/reminders

# Process daily digests every hour (checks user preferences)
15 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/daily-digest
```

### Vercel Cron Jobs

For Vercel deployment, use `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/daily-digest", 
      "schedule": "15 * * * *"
    }
  ]
}
```

## Integration Examples

### Triggering Notifications

#### From Chore Creation
```typescript
import { notificationService } from '@/lib/notification-service';

// After creating a chore
const result = await notificationService.sendChoreAssignmentNotification({
  choreId: chore._id.toString(),
  choreTitle: chore.title,
  choreDescription: chore.description,
  assignedTo: {
    id: assignedUser._id.toString(),
    name: assignedUser.name,
    email: assignedUser.email
  },
  assignedBy: {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email
  },
  family: {
    id: family._id.toString(),
    name: family.name
  },
  dueDate: chore.dueDate,
  priority: chore.priority,
  points: chore.points,
  requiresPhotoVerification: chore.requiresPhotoVerification
});

if (!result.success) {
  console.error('Failed to send assignment notification:', result.error);
}
```

#### From Photo Approval
```typescript
// After approving a photo
const result = await notificationService.sendPhotoApprovalNotification({
  choreId: chore._id.toString(),
  choreTitle: chore.title,
  assignedTo: {
    id: chore.assignedTo._id.toString(),
    name: chore.assignedTo.name,
    email: chore.assignedTo.email
  },
  family: {
    id: family._id.toString(),
    name: family.name
  },
  points: chore.points,
  photoUrl: photoVerification.url
});
```

## Monitoring & Analytics

### Key Metrics
- **Delivery Rate**: % of emails successfully sent
- **Open Rate**: % of sent emails opened
- **Click Rate**: % of opened emails clicked
- **Failure Rate**: % of emails that failed to send
- **Average Delivery Time**: Time from creation to delivery

### Logging
All notifications are logged with:
- Delivery status and timestamps
- Error details for failed sends
- Retry attempts and scheduling
- Performance metrics
- User interaction tracking

### Error Handling
- Automatic retry with exponential backoff
- Maximum retry limit (default: 3)
- Detailed error logging with categorization
- Failed notification reporting

## Best Practices

### Template Design
- Mobile-responsive layouts
- Clear call-to-action buttons
- Consistent branding and styling
- Proper fallback text for images
- Accessibility considerations

### Performance
- Batch processing for multiple recipients
- Rate limiting to respect provider limits
- Efficient database queries with indexing
- Caching for frequently accessed data

### User Experience
- Clear unsubscribe mechanisms
- Preference granularity
- Informative subject lines
- Personalized content
- Respectful timing (quiet hours)

### Security
- Input validation and sanitization
- Secure cron job authentication
- Protected API endpoints
- Email content sanitization
- Rate limiting on API endpoints

## Troubleshooting

### Common Issues

#### Emails Not Sending
1. Check RESEND_API_KEY configuration
2. Verify domain authentication in Resend
3. Check notification preferences are enabled
4. Review error logs in NotificationLog collection

#### Reminders Not Working
1. Verify cron jobs are running
2. Check CRON_SECRET configuration
3. Review user notification preferences
4. Ensure due dates are set correctly

#### High Bounce Rate
1. Verify email addresses are valid
2. Check domain reputation
3. Review email content for spam triggers
4. Ensure proper SPF/DKIM setup

### Debugging

#### Enable Debug Logging
```typescript
// Add to notification service functions
console.log('Sending notification:', {
  type: 'chore_assignment',
  recipient: data.assignedTo.email,
  choreId: data.choreId
});
```

#### Check Notification Logs
```typescript
import NotificationLog from '@/models/NotificationLog';

// Get recent failed notifications
const failed = await NotificationLog.find({
  status: 'failed',
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).limit(10);
```

## Future Enhancements

### Planned Features
- SMS notifications via Twilio
- Push notifications for mobile app
- Slack/Discord integration
- Advanced analytics dashboard
- A/B testing for email templates
- Machine learning for optimal send times
- Webhook support for external integrations

### Template Improvements
- Rich media support (videos, GIFs)
- Interactive elements (polls, surveys)
- Dynamic content based on user behavior
- Multi-language support
- Dark mode email templates

### Advanced Scheduling
- Smart send time optimization
- Timezone-aware delivery
- Holiday and weekend respect
- User behavior-based timing
- Batch processing optimization