import { user } from "../models/userModel.js";
import createHttpError from "http-errors";
import { encrypt } from "../utils/encrypt.js";
import mongoose from "mongoose";


type CreateUserInput = {
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
};

export const createUserService = async (data: CreateUserInput) => {
  const existingUser = await user.findOne({
    $or: [
      { email: data.email },
      { primaryMobile: data.primaryMobile },
    ],
  });

  if (existingUser) {
    throw createHttpError.Forbidden("User already exists");
  }

  const eAadhaar = encrypt(data.aadhaar);
  const ePan = encrypt(data.pan);

  const payload = {
    name: data.name,
    email: data.email,
    primaryMobile: data.primaryMobile,
    aadhaar: eAadhaar,
    pan: ePan,
    dateOfBirth: data.dateOfBirth,
    placeOfBirth: data.placeOfBirth,
    currentAddress: data.currentAddress,
    permanentAddress: data.permanentAddress,
    ...(data.secondaryMobile !== undefined && {
      secondaryMobile: data.secondaryMobile,
    }),
  };

  const newUser = await user.create(payload);

  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    primaryMobile: newUser.primaryMobile,
    secondaryMobile: newUser.secondaryMobile,
    dateOfBirth: newUser.dateOfBirth,
    placeOfBirth: newUser.placeOfBirth,
    currentAddress: newUser.currentAddress,
    permanentAddress: newUser.permanentAddress,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
};




type GetUsersInput = {
    limit:number;
    next?: string;
    name?: string;
    email?: string;
    mobile?: string;
    dob?: string;
}

export const getUsersService = async ({
  limit,
  next,
  name,
  email,
  mobile,
  dob,
}: GetUsersInput) => {
  const query: any = {};
  console.log({name,email,mobile,dob});
  if (name) {
    query.name = { $regex: name, $options: "i" };
  }

  if (email) {
    query.email = { $regex: email, $options: "i" };
  }

  if (mobile) {
    query.$or = [
      { primaryMobile: { $regex: mobile } },
      { secondaryMobile: { $regex: mobile } },
    ];
  }

  if (dob) {
    const start = new Date(dob);
    const end = new Date(dob);
    end.setDate(end.getDate() + 1);

    query.dateOfBirth = {
      $gte: start,
      $lt: end,
    };
  }

  if (next) {
    query._id = {
      $lt: new mongoose.Types.ObjectId(next),
    };
  }


  const users = await user
    .find(query)
    .sort({ _id: -1 }) //descending 
    .limit(limit + 1)
    .select("-aadhaar -pan -isDeleted -isActive -deletedAt -permanentAddress");

  const hasNextPage = users.length > limit;

  if (hasNextPage) {
    users.pop();
  }

  const nextCursor = users.length
  ? users[users.length - 1]?._id
  : null;

  return {
    users,
    pagination: {
      limit,
      hasNextPage,
      nextCursor,
    },
  };
};



type UpdateUserInput = {
  name?: string;
  email?: string;
  primaryMobile?: string;
  secondaryMobile?: string;
  aadhaar?: string;
  pan?: string;
  dateOfBirth?: Date | string;
  placeOfBirth?: string;
  currentAddress?: string;
  permanentAddress?: string;
};

export const updateUserService = async (id: string, data: UpdateUserInput) => {

  const findUser = await user.findById(id);
  
  if (!findUser) {
    throw createHttpError.NotFound("User not found");
  }
  
  const updatePayload: any = { ...data };

  if (data.aadhaar) {
    updatePayload.aadhaar = encrypt(data.aadhaar);
  }

  if (data.pan) {
    updatePayload.pan = encrypt(data.pan);
  }

  const updatedUser = await user
    .findByIdAndUpdate(id, updatePayload, { new: true })
    .select("-aadhaar -pan -isDeleted -isActive -deletedAt");

  if (!updatedUser) {
    throw createHttpError.NotFound("User not found");
  }

  return {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    primaryMobile: updatedUser.primaryMobile,
    secondaryMobile: updatedUser.secondaryMobile,
    dateOfBirth: updatedUser.dateOfBirth,
    placeOfBirth: updatedUser.placeOfBirth,
    currentAddress: updatedUser.currentAddress,
    permanentAddress: updatedUser.permanentAddress,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

