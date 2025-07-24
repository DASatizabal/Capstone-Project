import mongoose, { Document, Model, Types } from "mongoose";
import toJSON from "./plugins/toJSON";

export type ChoreStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'rejected';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface IChore extends Document {
  title: string;
  description?: string;
  instructions?: string;
  family: Types.ObjectId;
  assignedTo: Types.ObjectId | string; // Can be ObjectId (user) or string (name)
  assignedBy: Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  status: ChoreStatus;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  actualMinutes?: number;
  recurrence: RecurrenceType;
  customRecurrence?: {
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
    interval?: number; // Every X days/weeks/months
  };
  imageUrl?: string;
  requiresParentApproval: boolean;
  rejectionReason?: string;
  // Virtuals
  isOverdue: boolean;
  isRecurring: boolean;
  nextOccurrence?: Date;
}

const choreSchema = new mongoose.Schema<IChore>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be longer than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be longer than 1000 characters']
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions cannot be longer than 2000 characters']
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: [true, 'Family ID is required'],
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
      required: [true, 'Assigned user is required'],
      refPath: 'assignedToModel'
    },
    assignedToModel: {
      type: String,
      required: false,
      enum: ['User', null],
      default: null
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user is required']
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function(this: IChore, value: Date) {
          return !this.completedAt || value >= new Date();
        },
        message: 'Due date must be in the future for pending chores'
      }
    },
    completedAt: Date,
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'completed', 'verified', 'rejected'],
        message: 'Invalid status'
      },
      default: 'pending'
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high'
      },
      default: 'medium'
    },
    estimatedMinutes: {
      type: Number,
      min: [1, 'Estimated time must be at least 1 minute'],
      max: [1440, 'Estimated time cannot exceed 24 hours']
    },
    actualMinutes: {
      type: Number,
      min: [0, 'Actual time cannot be negative'],
      max: [1440, 'Actual time cannot exceed 24 hours']
    },
    recurrence: {
      type: String,
      enum: {
        values: ['once', 'daily', 'weekly', 'monthly', 'custom'],
        message: 'Invalid recurrence type'
      },
      default: 'once'
    },
    customRecurrence: {
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      daysOfMonth: [{
        type: Number,
        min: 1,
        max: 31
      }],
      interval: {
        type: Number,
        min: 1,
        default: 1
      }
    },
    imageUrl: {
      type: String,
      match: [/^https?:\/\//, 'Image URL must be a valid URL starting with http:// or https://']
    },
    requiresParentApproval: {
      type: Boolean,
      default: false
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot be longer than 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtuals
choreSchema.virtual('isOverdue').get(function(this: IChore) {
  return this.dueDate && this.status === 'pending' && this.dueDate < new Date();
});

choreSchema.virtual('isRecurring').get(function(this: IChore) {
  return this.recurrence !== 'once';
});

// Indexes for better query performance
choreSchema.index({ family: 1, status: 1 });
choreSchema.index({ assignedTo: 1, status: 1 });
choreSchema.index({ dueDate: 1 });
choreSchema.index({ status: 1, dueDate: 1 });

// Pre-save hook to handle status changes
choreSchema.pre('save', function(next) {
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set verifiedAt when status changes to verified
  if (this.isModified('status') && this.status === 'verified' && !this.verifiedAt) {
    this.verifiedAt = new Date();
  }
  
  next();
});

// Add the toJSON plugin
choreSchema.plugin(toJSON);

// Create the model with proper typing
const Chore: Model<IChore> = mongoose.models.Chore || mongoose.model<IChore>("Chore", choreSchema);

export default Chore;
