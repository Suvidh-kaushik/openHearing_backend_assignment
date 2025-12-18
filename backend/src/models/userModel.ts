import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id:mongoose.Types.ObjectId,
  name: string;
  email: string;

  primaryMobile: string;
  secondaryMobile?: string;

  aadhaar: string;
  pan: string;

  dateOfBirth: Date;
  placeOfBirth: string;

  currentAddress: string;
  permanentAddress: string;

  isActive: boolean;
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
      required: true,
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
      required: true,
      unique: true,
      index: true,
    },

    secondaryMobile: {
      type: String,
    },

    aadhaar: {
      type: String,
      required: true,
      select: false,
    },

    pan: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
      select: false,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    placeOfBirth: {
      type: String,
      required: true,
      trim: true,
    },

    currentAddress: {
      type: String,
      required: true,
      minlength: 10,
    },

    permanentAddress: {
      type: String,
      required: true,
      minlength: 10,
    },

    isActive: {
      type: Boolean,
      default: true,
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