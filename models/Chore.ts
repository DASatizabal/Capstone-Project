import mongoose, { Model, Types, Schema, HydratedDocument } from "mongoose";
import toJSON from "./plugins/toJSON";

declare module 'mongoose' {
  interface Document {
    previous<T>(path?: string): T;
  }
}

// Chore status type
export type ChoreStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'rejected' | 'cancelled';

// Chore priority type
export type ChorePriority = 'low' | 'medium' | 'high';

// Recurrence type
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'once' | 'none';

export interface IRecurrence {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  month?: number;
  customRecurrence?: ICustomRecurrence;
  nextOccurrence?: Date;
  lastOccurrence?: Date;
  count?: number;
  maxCount?: number;
  endDate?: Date;
}

interface IHistoryEntry {
  action: string;
  timestamp: Date;
  user: Types.ObjectId;
  details?: Record<string, any>;
}

interface ICustomRecurrence {
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  interval?: number;
}

export interface IChore extends Document {
  // Basic chore information
  title: string;
  description?: string;
  instructions?: string;
  category?: string;
  notes?: string;
  
  // Status and tracking
  status: ChoreStatus;
  priority: ChorePriority;
  points: number;
  
  // Dates
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  cancelledAt?: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  
  // References
  assignedTo?: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedAt?: Date;
  family: Types.ObjectId;
  createdBy: Types.ObjectId;
  verifiedBy?: Types.ObjectId;
  cancelledBy?: Types.ObjectId;
  completedBy?: Types.ObjectId;
  
  // Photo verification
  requiresPhotoVerification: boolean;
  imageUrl?: string;
  photoVerification?: Array<{
    url: string;
    uploadedAt: Date;
    uploadedBy: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
    rejectionReason?: string;
  }>;
  
  // Recurrence
  isRecurring: boolean;
  recurrence?: IRecurrence;
  
  // Time tracking
  estimatedMinutes?: number;
  actualMinutes?: number;
  
  // History and audit
  history: IHistoryEntry[];
  
  // Rejection
  rejectionReason?: string;
}

interface IChoreMethods {
  isOverdue(): boolean;
  isRecurring(): boolean;
  getNextOccurrence(): Date | null;
}

type ChoreDocument = HydratedDocument<IChore, IChoreMethods>;

interface IChoreModel extends Model<IChore, {}, IChoreMethods> {
  // Add static methods here if needed
}

const historyEntrySchema = new Schema<IHistoryEntry>({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: Schema.Types.Mixed }
}, { _id: false });

const choreSchema = new Schema<IChore, IChoreModel, IChoreMethods>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  family: {
    type: Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Family is required'],
    index: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by is required']
  },
  assignedAt: {
    type: Date
  },
  dueDate: {
    type: Date,
    index: true
  },
  completedAt: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'verified', 'rejected'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [0, 'Points must be at least 0']
  },
  estimatedMinutes: {
    type: Number,
    min: [0, 'Estimated minutes must be at least 0']
  },
  actualMinutes: {
    type: Number,
    min: [0, 'Actual minutes must be at least 0']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom', 'once', 'none'],
      default: 'once'
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    daysOfWeek: [{
      type: Number,
      min: 0, // Sunday
      max: 6  // Saturday
    }],
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    month: {
      type: Number,
      min: 0, // January
      max: 11 // December
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
        min: 1
      }
    },
    nextOccurrence: Date,
    lastOccurrence: Date,
    count: {
      type: Number,
      min: 0
    },
    maxCount: {
      type: Number,
      min: 1
    },
    endDate: Date
  },
  imageUrl: {
    type: String,
    trim: true
  },
  requiresPhotoVerification: {
    type: Boolean,
    default: false
  },
  // Rejection reason for chore rejection
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  history: [historyEntrySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes
choreSchema.index({ family: 1, status: 1 });
choreSchema.index({ assignedTo: 1, status: 1 });
choreSchema.index({ dueDate: 1 });
choreSchema.index({ status: 1, dueDate: 1 });

// Instance methods
choreSchema.method('isOverdue', function(this: ChoreDocument): boolean {
  if (['completed', 'verified'].includes(this.status)) return false;
  if (!this.dueDate) return false;
  return this.dueDate < new Date();
});

choreSchema.method('isRecurring', function(this: ChoreDocument): boolean {
  return Boolean(this.recurrence && this.recurrence.type && 
    this.recurrence.type !== 'once' && 
    this.recurrence.type !== 'none');
});

choreSchema.method('getNextOccurrence', function(this: ChoreDocument): Date | null {
  if (!this.recurrence || !this.dueDate) {
    return null;
  }
  
  const { type, interval = 1 } = this.recurrence;
  
  if (type === 'none' || type === 'once' || !this.dueDate) {
    return null;
  }
  
  const nextDate = new Date(this.dueDate);
  const now = new Date();
  
  while (nextDate <= now) {
    switch (type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (interval || 1));
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * (interval || 1));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + (interval || 1));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + (interval || 1));
        break;
      case 'custom':
        if (this.recurrence.customRecurrence?.interval) {
          nextDate.setDate(nextDate.getDate() + this.recurrence.customRecurrence.interval);
        } else {
          return null;
        }
        break;
      default:
        return null;
    }
  }
  
  return nextDate;
});

// Virtuals
choreSchema.virtual('nextOccurrence').get(function(this: ChoreDocument): Date | null {
  return this.getNextOccurrence();
});

// Pre-save hook to handle status changes and history
choreSchema.pre('save', async function(this: ChoreDocument, next) {
  try {
    // If this is a new chore, add creation to history
    if (this.isNew) {
      this.history = [{
        action: 'created',
        timestamp: new Date(),
        user: this.assignedBy,
        details: {
          assignedTo: this.assignedTo,
          dueDate: this.dueDate,
          points: this.points
        }
      }];
    } else if (this.isModified()) {
      // Track changes to important fields
      const changes: Record<string, any> = {};
      const modifiedPaths = this.modifiedPaths();
      
      modifiedPaths.forEach(path => {
        if (['status', 'assignedTo', 'dueDate', 'points', 'priority'].includes(path)) {
          changes[path] = this.get(path);
        }
      });
      
      // Only add to history if there are relevant changes
      if (Object.keys(changes).length > 0) {
        this.history.push({
          action: 'updated',
          timestamp: new Date(),
          user: this.assignedBy,
          details: changes
        });
      }
      
      // Update timestamps based on status
      if (this.status === 'completed') {
        this.completedAt = new Date();
      } else if (this.status === 'verified') {
        this.verifiedAt = new Date();
        this.verifiedBy = this.assignedBy;
      }
      
      // Handle recurring chores
      if (this.status === 'completed' && 
          this.recurrence && 
          this.recurrence.type &&
          this.recurrence.type !== 'none' && 
          this.recurrence.type !== 'once' &&
          !this.deletedAt) {
        
        const nextOccurrence = this.getNextOccurrence();
        if (nextOccurrence) {
          const choreData = this.toObject();
          const nextChore = new Chore({
            ...choreData,
            _id: new mongoose.Types.ObjectId(),
            status: 'pending',
            completedAt: undefined,
            verifiedAt: undefined,
            verifiedBy: undefined,
            rejectionReason: undefined,
            history: [],
            dueDate: nextOccurrence
          });
          
          // Save the next occurrence
          await nextChore.save();
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error as Error);
  }
});

// Soft delete middleware
choreSchema.pre(/^find/, function(this: any, next) {
  if (this.getFilter().deletedAt === undefined) {
    this.setQuery({ ...this.getFilter(), deletedAt: null });
  }
  next();
});

// Add the toJSON plugin
// Using type assertion to handle the type mismatch
choreSchema.plugin(toJSON as any);

// Create and export the model
const Chore = mongoose.model<IChore, IChoreModel>('Chore', choreSchema);

export default Chore;
export type { ChoreDocument };
