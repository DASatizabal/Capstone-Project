import mongoose, { Document, Model, Types } from "mongoose";

import toJSON from "./plugins/toJSON";

// Types for the Family Member subdocument
export type FamilyMemberRole = "parent" | "child" | "admin";

export interface IFamilyMember {
  name: string;
  phone?: string;
  age?: number;
  role: FamilyMemberRole;
  user: Types.ObjectId; // Reference to User model if they have an account
}

// Interface for the Family document
export interface IFamily extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: IFamilyMember[];
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  parentUsers: Types.ObjectId[];
  childUsers: Types.ObjectId[];
  // Methods
  getParentIds(): Types.ObjectId[];
  getChildIds(): Types.ObjectId[];
}

const familyMemberSchema = new mongoose.Schema<IFamilyMember>({
  name: {
    type: String,
    required: [true, "Member name is required"],
    trim: true,
  },
  phone: {
    type: String,
    validate: {
      validator(v: string) {
        // Simple phone number validation (adjust regex as needed)
        return (
          !v ||
          /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(v)
        );
      },
      message: (props: any) => `${props.value} is not a valid phone number!`,
    },
  },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"],
    max: [120, "Age seems unrealistic"],
  },
  role: {
    type: String,
    enum: {
      values: ["parent", "child", "admin"],
      message: 'Role must be "parent", "child", or "admin"',
    },
    default: "child",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const familySchema = new mongoose.Schema<IFamily>(
  {
    name: {
      type: String,
      required: [true, "Family name is required"],
      trim: true,
      maxlength: [50, "Family name cannot be longer than 50 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user ID is required"],
    },
    members: [familyMemberSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // Remove version key and any other sensitive/unecessary fields
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Add virtuals for easy access to parents and children
familySchema.virtual("parentUsers", {
  ref: "User",
  localField: "members.user",
  foreignField: "_id",
  match: { "members.role": "parent" },
});

familySchema.virtual("childUsers", {
  ref: "User",
  localField: "members.user",
  foreignField: "_id",
  match: { "members.role": "child" },
});

// Helper methods to get member user IDs
familySchema.methods.getParentIds = function (): Types.ObjectId[] {
  return this.members
    .filter((member: IFamilyMember) => member.role === "parent")
    .map((member: IFamilyMember) => member.user);
};

familySchema.methods.getChildIds = function (): Types.ObjectId[] {
  return this.members
    .filter((member: IFamilyMember) => member.role === "child")
    .map((member: IFamilyMember) => member.user);
};

// Indexes for better query performance
familySchema.index({ createdBy: 1 });
familySchema.index({ "members.user": 1 });

// Add the toJSON plugin
familySchema.plugin(toJSON);

// Pre-save hook to ensure at least one parent exists
familySchema.pre("save", function (next) {
  if (this.isNew || this.isModified("members")) {
    const hasParent = this.members.some((member) => member.role === "parent");
    if (!hasParent) {
      const error = new Error("Family must have at least one parent");
      return next(error);
    }

    // Ensure user references are unique
    const userIds = this.members.map((member) => member.user.toString());
    const uniqueUserIds = Array.from(new Set(userIds));

    if (userIds.length !== uniqueUserIds.length) {
      const error = new Error(
        "Duplicate user references are not allowed in family members",
      );
      return next(error);
    }
  }
  next();
});

// Create the model with proper typing
const Family: Model<IFamily> =
  mongoose.models.Family || mongoose.model<IFamily>("Family", familySchema);

export default Family;
