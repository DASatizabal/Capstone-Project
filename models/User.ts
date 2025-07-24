import mongoose, { Document, Model } from "mongoose";
import toJSON from "./plugins/toJSON";

// Interface for User document
export interface IUser extends Document {
  name?: string;
  email: string;
  image?: string;
  customerId?: string;
  priceId?: string;
  hasAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileUrl?: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      private: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    image: {
      type: String,
    },
    customerId: {
      type: String,
      validate: {
        validator: (val: string) => !val || val.startsWith("cus_"),
        message: 'Customer ID must start with "cus_"'
      },
    },
    priceId: {
      type: String,
      validate: {
        validator: (val: string) => !val || val.startsWith("price_"),
        message: 'Price ID must start with "price_"'
      },
    },
    hasAccess: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Remove sensitive data from JSON output
        delete ret.__v;
        return ret;
      }
    },
  }
);

// Add virtual for profile URL
userSchema.virtual('profileUrl').get(function(this: IUser) {
  return this.image || '/images/default-avatar.png';
});

// Add indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ customerId: 1 }, { unique: true, sparse: true });

// Add the toJSON plugin
userSchema.plugin(toJSON);

// Create the model with proper typing
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
