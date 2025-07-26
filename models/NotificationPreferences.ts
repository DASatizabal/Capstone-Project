// models/NotificationPreferences.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

import toJSON from "./plugins/toJSON";

export interface INotificationPreferences extends Document {
  user: Types.ObjectId;
  family: Types.ObjectId;

  // Email preferences
  email: {
    enabled: boolean;
    choreAssignments: boolean;
    choreReminders: boolean;
    choreCompletions: boolean;
    photoApprovals: boolean;
    photoRejections: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };

  // Timing preferences
  reminderTiming: {
    firstReminder: number; // days before due date
    secondReminder: number; // days before due date
    finalReminder: number; // hours before due date
  };

  // Digest preferences
  dailyDigestTime: string; // HH:MM format (24-hour)
  weeklyReportDay: number; // 0-6 (Sunday-Saturday)
  weeklyReportTime: string; // HH:MM format (24-hour)

  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
  };

  // Last notification timestamps (for rate limiting)
  lastNotifications: {
    choreAssignment: Date;
    choreReminder: Date;
    choreCompletion: Date;
    photoApproval: Date;
    dailyDigest: Date;
    weeklyReport: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferencesSchema = new Schema<INotificationPreferences>(
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
      required: true,
      index: true,
    },
    email: {
      enabled: {
        type: Boolean,
        default: true,
      },
      choreAssignments: {
        type: Boolean,
        default: true,
      },
      choreReminders: {
        type: Boolean,
        default: true,
      },
      choreCompletions: {
        type: Boolean,
        default: true,
      },
      photoApprovals: {
        type: Boolean,
        default: true,
      },
      photoRejections: {
        type: Boolean,
        default: true,
      },
      dailyDigest: {
        type: Boolean,
        default: false,
      },
      weeklyReport: {
        type: Boolean,
        default: false,
      },
    },
    reminderTiming: {
      firstReminder: {
        type: Number,
        default: 2, // 2 days before due date
        min: 0,
        max: 7,
      },
      secondReminder: {
        type: Number,
        default: 1, // 1 day before due date
        min: 0,
        max: 7,
      },
      finalReminder: {
        type: Number,
        default: 2, // 2 hours before due date
        min: 0,
        max: 24,
      },
    },
    dailyDigestTime: {
      type: String,
      default: "18:00", // 6 PM
      validate: {
        validator(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Time must be in HH:MM format",
      },
    },
    weeklyReportDay: {
      type: Number,
      default: 0, // Sunday
      min: 0,
      max: 6,
    },
    weeklyReportTime: {
      type: String,
      default: "09:00", // 9 AM
      validate: {
        validator(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Time must be in HH:MM format",
      },
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: "22:00", // 10 PM
        validate: {
          validator(v: string) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: "Time must be in HH:MM format",
        },
      },
      endTime: {
        type: String,
        default: "07:00", // 7 AM
        validate: {
          validator(v: string) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: "Time must be in HH:MM format",
        },
      },
      timezone: {
        type: String,
        default: "America/New_York",
      },
    },
    lastNotifications: {
      choreAssignment: {
        type: Date,
        default: null,
      },
      choreReminder: {
        type: Date,
        default: null,
      },
      choreCompletion: {
        type: Date,
        default: null,
      },
      photoApproval: {
        type: Date,
        default: null,
      },
      dailyDigest: {
        type: Date,
        default: null,
      },
      weeklyReport: {
        type: Date,
        default: null,
      },
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
notificationPreferencesSchema.index({ user: 1, family: 1 }, { unique: true });
notificationPreferencesSchema.index({
  "email.dailyDigest": 1,
  dailyDigestTime: 1,
});
notificationPreferencesSchema.index({
  "email.weeklyReport": 1,
  weeklyReportDay: 1,
  weeklyReportTime: 1,
});

// Add the toJSON plugin
notificationPreferencesSchema.plugin(toJSON);

// Static method to get or create preferences
notificationPreferencesSchema.statics.getOrCreatePreferences = async function (
  userId: string,
  familyId: string,
): Promise<INotificationPreferences> {
  let preferences = await this.findOne({ user: userId, family: familyId });

  if (!preferences) {
    preferences = await this.create({
      user: userId,
      family: familyId,
    });
  }

  return preferences;
};

// Instance method to check if notifications are allowed at current time
notificationPreferencesSchema.methods.isNotificationAllowed =
  function (): boolean {
    if (!this.quietHours.enabled) {
      return true;
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: this.quietHours.timezone,
    });

    const [startHour, startMin] = this.quietHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMin] = this.quietHours.endTime.split(":").map(Number);
    const [currentHour, currentMin] = currentTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = currentHour * 60 + currentMin;

    // If quiet hours cross midnight
    if (startMinutes > endMinutes) {
      return currentMinutes < endMinutes || currentMinutes > startMinutes;
    } else {
      return currentMinutes < startMinutes || currentMinutes > endMinutes;
    }
  };

// Instance method to update last notification timestamp
notificationPreferencesSchema.methods.updateLastNotification = function (
  type: string,
): Promise<INotificationPreferences> {
  if (this.lastNotifications && typeof this.lastNotifications === "object") {
    this.lastNotifications[type] = new Date();
  }
  return this.save();
};

// Create and export the model
const NotificationPreferences: Model<INotificationPreferences> =
  mongoose.models.NotificationPreferences ||
  mongoose.model<INotificationPreferences>(
    "NotificationPreferences",
    notificationPreferencesSchema,
  );

export default NotificationPreferences;
