// models/NotificationLog.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

import toJSON from "./plugins/toJSON";

export type NotificationType =
  | "chore_assignment"
  | "chore_reminder"
  | "chore_completion"
  | "photo_approval"
  | "photo_rejection"
  | "daily_digest"
  | "weekly_report"
  | "test";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "bounced"
  | "opened"
  | "clicked";

export interface INotificationLog extends Document {
  // Core fields
  user: Types.ObjectId;
  family?: Types.ObjectId;
  chore?: Types.ObjectId;

  // Notification details
  type: NotificationType;
  status: NotificationStatus;
  recipient: string; // email address
  subject: string;

  // External service data
  emailId?: string; // Resend email ID
  resendData?: any; // Raw response from Resend

  // Tracking
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  failedAt?: Date;

  // Error information
  error?: {
    message: string;
    code?: string;
    details?: any;
  };

  // Retry information
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;

  // Metadata
  metadata?: {
    choreTitle?: string;
    daysUntilDue?: number;
    priority?: string;
    points?: number;
    familyName?: string;
    [key: string]: any;
  };

  createdAt: Date;
  updatedAt: Date;
}

const notificationLogSchema = new Schema<INotificationLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    family: {
      type: Schema.Types.ObjectId,
      ref: "Family",
      index: true,
    },
    chore: {
      type: Schema.Types.ObjectId,
      ref: "Chore",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "chore_assignment",
        "chore_reminder",
        "chore_completion",
        "photo_approval",
        "photo_rejection",
        "daily_digest",
        "weekly_report",
        "test",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "bounced", "opened", "clicked"],
      default: "pending",
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 500,
    },
    emailId: {
      type: String,
      sparse: true,
      index: true,
    },
    resendData: {
      type: Schema.Types.Mixed,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    openedAt: {
      type: Date,
    },
    clickedAt: {
      type: Date,
    },
    bouncedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    error: {
      message: {
        type: String,
        maxlength: 1000,
      },
      code: {
        type: String,
        maxlength: 100,
      },
      details: {
        type: Schema.Types.Mixed,
      },
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    nextRetryAt: {
      type: Date,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for efficient queries
notificationLogSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationLogSchema.index({ family: 1, type: 1, createdAt: -1 });
notificationLogSchema.index({ status: 1, nextRetryAt: 1 });
notificationLogSchema.index({ createdAt: -1 });

// TTL index to automatically delete old logs (optional - keep 90 days)
notificationLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

// Virtual for calculating delivery time
notificationLogSchema.virtual("deliveryTime").get(function () {
  if (this.sentAt && this.createdAt) {
    return this.sentAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// Instance methods
notificationLogSchema.methods.markAsSent = function (
  emailId?: string,
  resendData?: any,
) {
  this.status = "sent";
  this.sentAt = new Date();
  if (emailId) this.emailId = emailId;
  if (resendData) this.resendData = resendData;
  return this.save();
};

notificationLogSchema.methods.markAsFailed = function (error: {
  message: string;
  code?: string;
  details?: any;
}) {
  this.status = "failed";
  this.failedAt = new Date();
  this.error = error;

  // Schedule retry if we haven't exceeded max retries
  if (this.retryCount < this.maxRetries) {
    const retryDelayMinutes = Math.pow(2, this.retryCount) * 5; // Exponential backoff: 5, 10, 20 minutes
    this.nextRetryAt = new Date(Date.now() + retryDelayMinutes * 60 * 1000);
  }

  return this.save();
};

notificationLogSchema.methods.markAsOpened = function () {
  if (this.status === "sent") {
    this.status = "opened";
    this.openedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

notificationLogSchema.methods.markAsClicked = function () {
  if (["sent", "opened"].includes(this.status)) {
    this.status = "clicked";
    this.clickedAt = new Date();
    // Also set openedAt if not already set
    if (!this.openedAt) {
      this.openedAt = new Date();
    }
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
notificationLogSchema.statics.createLog = function (
  data: Partial<INotificationLog>,
) {
  return this.create(data);
};

notificationLogSchema.statics.getFailedNotifications = function (limit = 100) {
  return this.find({
    status: "failed",
    retryCount: { $lt: this.schema.paths.maxRetries.options.default },
    nextRetryAt: { $lte: new Date() },
  })
    .limit(limit)
    .sort({ nextRetryAt: 1 });
};

notificationLogSchema.statics.getNotificationStats = function (
  userId?: string,
  familyId?: string,
  days = 30,
) {
  const match: any = {
    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  };

  if (userId) match.user = new mongoose.Types.ObjectId(userId);
  if (familyId) match.family = new mongoose.Types.ObjectId(familyId);

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          type: "$type",
          status: "$status",
        },
        count: { $sum: 1 },
        avgDeliveryTime: {
          $avg: {
            $cond: [
              { $and: ["$sentAt", "$createdAt"] },
              { $subtract: ["$sentAt", "$createdAt"] },
              null,
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.type",
        stats: {
          $push: {
            status: "$_id.status",
            count: "$count",
            avgDeliveryTime: "$avgDeliveryTime",
          },
        },
        totalCount: { $sum: "$count" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Add the toJSON plugin
notificationLogSchema.plugin(toJSON);

// Create and export the model
const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>("NotificationLog", notificationLogSchema);

export default NotificationLog;
