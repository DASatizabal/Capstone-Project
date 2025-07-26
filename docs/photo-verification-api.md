# Photo Verification API Documentation

## Overview

The photo verification system allows children to upload photos as proof of chore completion, which parents can then approve or reject. This creates an accountability system for household chores.

## Architecture

### Database Schema

The photo verification is integrated into the existing `Chore` model with a `photoVerification` array:

```typescript
photoVerification?: Array<{
  url: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
}>;
```

### Workflow

1. **Photo Upload**: Child uploads photo when completing chore
2. **Automatic Status Change**: Chore status changes to "completed"
3. **Parent Review**: Parents see pending photo approvals
4. **Approval/Rejection**: Parent approves or rejects with reason
5. **Final Status**: Chore becomes "verified" (approved) or "pending" (rejected)

## API Endpoints

### 1. Photo Upload

**POST** `/api/chores/[id]/photos`

Upload a photo for chore verification.

**Request:**
- `Content-Type: multipart/form-data`
- `photo`: Image file (JPEG, PNG, WebP, max 10MB)

**Response:**
```json
{
  "message": "Photo uploaded successfully",
  "photoUrl": "https://bucket.s3.region.amazonaws.com/path/to/photo.jpg",
  "chore": {
    "id": "chore_id",
    "status": "completed",
    "photoVerification": [...]
  }
}
```

**Permissions:**
- User must be assigned to the chore OR be a family member
- Chore must have `requiresPhotoVerification: true`

### 2. Get Photos

**GET** `/api/chores/[id]/photos`

Get all photos for a chore.

**Response:**
```json
{
  "choreId": "chore_id",
  "choreTitle": "Take out trash",
  "requiresPhotoVerification": true,
  "photos": [
    {
      "url": "photo_url",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "uploadedBy": { "name": "John", "image": "avatar_url" },
      "status": "pending",
      "reviewedAt": null,
      "reviewedBy": null,
      "rejectionReason": null
    }
  ]
}
```

### 3. Photo Verification

**POST** `/api/chores/[id]/verify`

Approve or reject a photo.

**Request:**
```json
{
  "photoIndex": 0,
  "action": "approve", // or "reject"
  "rejectionReason": "Photo is blurry" // required for reject
}
```

**Response:**
```json
{
  "message": "Photo approved successfully",
  "chore": {
    "id": "chore_id",
    "status": "verified", // or "pending" if rejected
    "photoVerification": [...]
  }
}
```

**Permissions:**
- Only parents can approve/reject photos

### 4. Get Verification Status

**GET** `/api/chores/[id]/verify`

Get verification status and details.

**Response:**
```json
{
  "chore": {
    "id": "chore_id",
    "title": "Take out trash",
    "status": "completed",
    "requiresPhotoVerification": true
  },
  "verification": {
    "totalPhotos": 2,
    "pendingCount": 1,
    "approvedCount": 1,
    "rejectedCount": 0,
    "canApprove": true,
    "photos": [...]
  }
}
```

### 5. Pending Approvals (Parent Dashboard)

**GET** `/api/families/[id]/pending-approvals`

Get all pending photo approvals for parents.

**Response:**
```json
{
  "family": { "id": "family_id", "name": "Smith Family" },
  "summary": {
    "totalChoresWithPendingPhotos": 3,
    "totalPendingPhotos": 5
  },
  "pendingApprovals": [
    {
      "chore": {
        "id": "chore_id",
        "title": "Clean room",
        "assignedTo": { "name": "Alice" }
      },
      "pendingPhotos": [
        {
          "index": 0,
          "url": "photo_url",
          "uploadedAt": "2024-01-01T00:00:00.000Z",
          "uploadedBy": { "name": "Alice" }
        }
      ]
    }
  ]
}
```

### 6. Bulk Photo Approval

**POST** `/api/families/[id]/pending-approvals`

Approve or reject multiple photos at once.

**Request:**
```json
{
  "approvals": [
    {
      "choreId": "chore_id_1",
      "photoIndex": 0,
      "action": "approve"
    },
    {
      "choreId": "chore_id_2",
      "photoIndex": 0,
      "action": "reject",
      "rejectionReason": "Please retake with better lighting"
    }
  ]
}
```

### 7. Photo Summary Dashboard

**GET** `/api/families/[id]/photo-summary`

Get summary statistics for photo verification dashboard.

**Response:**
```json
{
  "family": { "id": "family_id", "name": "Smith Family" },
  "user": { "canApprove": true },
  "summary": {
    "totalChoresWithPhotos": 10,
    "pendingApprovals": 3,
    "recentlyApproved": 5,
    "recentlyRejected": 1
  }
}
```

## Image Processing

### Optimization
- Images are automatically optimized before upload
- Max dimensions: 1920x1080
- Quality: 80%
- Supported formats: JPEG, PNG, WebP

### Storage
- Images stored in AWS S3
- Path structure: `chore-photos/{familyId}/{choreId}/{timestamp}-{random}.{ext}`
- Public read access for family members

### Validation
- File size limit: 10MB
- Allowed types: JPEG, PNG, WebP
- Server-side validation before S3 upload

## Security & Permissions

### Access Control
- **Photo Upload**: Assigned user or family member
- **Photo Viewing**: Family members only
- **Photo Approval**: Parents only
- **Bulk Operations**: Parents only

### Data Privacy
- Photos are scoped to family
- S3 keys include family ID for isolation
- No cross-family access possible

## Error Handling

### Common Error Codes
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (wrong permissions)
- `404`: Resource not found
- `400`: Bad request (validation errors)
- `500`: Server error

### Validation Errors
- Invalid file type
- File too large
- Missing required fields
- Photo already reviewed
- Invalid photo index

## Integration Examples

### Frontend Photo Upload
```javascript
const uploadPhoto = async (choreId, photoFile) => {
  const formData = new FormData();
  formData.append('photo', photoFile);
  
  const response = await fetch(`/api/chores/${choreId}/photos`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

### Parent Approval Interface
```javascript
const approvePhoto = async (choreId, photoIndex) => {
  const response = await fetch(`/api/chores/${choreId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoIndex,
      action: 'approve'
    })
  });
  
  return response.json();
};
```

## Future Enhancements

### Image Optimization with Sharp
To add proper server-side image optimization:

```bash
npm install sharp
```

Then update `lib/image-optimization.ts` to use Sharp for resizing and compression.

### Additional Features
- Photo annotations/comments
- Multiple photos per chore requirement
- Photo templates/guidelines
- Automatic photo quality validation
- Photo comparison for recurring chores

## Monitoring & Analytics

### Metrics to Track
- Photo upload success rate
- Average approval time
- Rejection reasons analysis
- Storage usage per family
- API response times

### Logging
- All photo operations logged with user ID
- S3 upload success/failure tracking
- Approval/rejection audit trail
- Error rate monitoring