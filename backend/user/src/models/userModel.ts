import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id:mongoose.Types.ObjectId,
  name?: string;
  email: string;
  primaryMobile?: string;
  secondaryMobile?: string;
  aadhaar?: string;
  pan?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  currentAddress?: string;
  permanentAddress?: string;
  isDeleted: boolean;
  isVerified?: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    primaryMobile: {
      type: String,
      unique: true,
      index: true,
    },

    secondaryMobile: {
      type: String,
    },

    aadhaar: {
      type: String,
      select: false,
    },

    pan: {
      type: String,
      uppercase: true,
      index: true,
      select: false,
    },

    dateOfBirth: {
      type: Date,
    },

    placeOfBirth: {
      type: String,
      trim: true,
    },
    currentAddress: {
      type: String,
      minlength: 10,
    },
    permanentAddress: {
      type: String,
      minlength: 10,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, 
    versionKey: false,
  }
);

export const user = mongoose.model("User",userSchema);