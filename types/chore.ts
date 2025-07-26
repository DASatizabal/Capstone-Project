import { Types } from "mongoose";

export type ChoreStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "verified"
  | "rejected"
  | "overdue";
export type ChorePriority = "low" | "medium" | "high";
export type RecurrenceType = "once" | "daily" | "weekly" | "monthly" | "custom";

export interface IChore {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  family: Types.ObjectId;
  assignedTo: Types.ObjectId | string; // Can be ObjectId (user) or string (name)
  assignedBy: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  status: ChoreStatus;
  priority: ChorePriority;
  points: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
  recurrence: RecurrenceType;
  customRecurrence?: {
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
    interval?: number; // Every X days/weeks/months
  };
  imageUrl?: string;
  requiresPhotoVerification: boolean;
  rejectionReason?: string;
  history: Array<{
    action: string;
    timestamp: Date;
    user: Types.ObjectId;
    details?: any;
  }>;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Virtuals
  isOverdue: boolean;
  isRecurring: boolean;
  nextOccurrence?: Date;
}

export interface CreateChoreDto {
  title: string;
  description?: string;
  familyId: string;
  assignedTo?: string;
  dueDate?: string | Date;
  priority?: ChorePriority;
  points?: number;
  requiresPhotoVerification?: boolean;
  recurrence?: RecurrenceType;
  customRecurrence?: {
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    interval?: number;
  };
  instructions?: string[];
  category?: string;
}

export interface UpdateChoreDto {
  title?: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string | Date;
  priority?: ChorePriority;
  status?: ChoreStatus;
  points?: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
  imageUrl?: string;
  rejectionReason?: string;
}

export interface ChoreFilterOptions {
  familyId?: string;
  status?: ChoreStatus;
  assignedTo?: string;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ChorePaginationResult {
  chores: IChore[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}
