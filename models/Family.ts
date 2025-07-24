import mongoose, { Document, Model, Types } from "mongoose";
import toJSON from "./plugins/toJSON";

// Types for the Family Member subdocument
export interface IFamilyMember {
  name: string;
  phone?: string;
  age?: number;
  role: "parent" | "child";
  userId?: Types.ObjectId; // Reference to User model if they have an account
}

// Interface for the Family document
export interface IFamily extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: IFamilyMember[];
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  parents: IFamilyMember[];
  children: IFamilyMember[];
}

const familyMemberSchema = new mongoose.Schema<IFamilyMember>({
  name: { 
    type: String, 
    required: [true, 'Member name is required'],
    trim: true
  },
  phone: { 
    type: String,
    validate: {
      validator: function(v: string) {
        // Simple phone number validation (adjust regex as needed)
        return !v || /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid phone number!`
    }
  },
  age: { 
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age seems unrealistic']
  },
  role: { 
    type: String, 
    enum: {
      values: ["parent", "child"],
      message: 'Role must be either "parent" or "child"'
    }, 
    default: "child" 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
});

const familySchema = new mongoose.Schema<IFamily>(
  {
    name: { 
      type: String, 
      required: [true, 'Family name is required'],
      trim: true,
      maxlength: [50, 'Family name cannot be longer than 50 characters']
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, 'Creator user ID is required']
    },
    members: [familyMemberSchema],
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Remove version key and any other sensitive/unecessary fields
        delete ret.__v;
        return ret;
      }
    },
  }
);

// Add virtuals for easy access to parents and children
familySchema.virtual('parents').get(function(this: IFamily) {
  return this.members.filter(member => member.role === 'parent');
});

familySchema.virtual('children').get(function(this: IFamily) {
  return this.members.filter(member => member.role === 'child');
});

// Indexes for better query performance
familySchema.index({ createdBy: 1 });
familySchema.index({ 'members.userId': 1 }, { sparse: true });

// Add the toJSON plugin
familySchema.plugin(toJSON);

// Pre-save hook to ensure at least one parent exists
familySchema.pre('save', function(next) {
  if (this.isNew || this.isModified('members')) {
    const hasParent = this.members.some(member => member.role === 'parent');
    if (!hasParent) {
      const error = new Error('Family must have at least one parent');
      return next(error);
    }
  }
  next();
});

// Create the model with proper typing
const Family: Model<IFamily> = mongoose.models.Family || mongoose.model<IFamily>("Family", familySchema);

export default Family;
