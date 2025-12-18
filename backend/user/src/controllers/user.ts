import type { NextFunction, Request, Response } from "express";
import { createUserService, deleteUserService, getUsersService, updateUserService } from "../services/user.js";
import type { AuthenticatedRequest } from "../middlewares/authenticate.js";
import type { IUser } from "../models/userModel.js";

export const createUserController = async(req:AuthenticatedRequest,res:Response,next:NextFunction) =>{
    try{
        const {email} = req.user as IUser;
        const user = await createUserService({...req.body, email});

        return res.status(201).json({
            status: 201,
            message: "User created successfully",
            data: user
        });

    }catch(err){
        console.error(err);
        next(err);
    }
};



export const getUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit, next, name, email, mobile, dob } = req.query;

    const input = {
      limit: Number(limit),
      next: next,
      name: name,
      email: email,
      mobile: mobile,
      dob: dob,
    };

    const users = await getUsersService(input as any);

    return res.status(200).json({
      status: 200,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();
    const data = req.body;

    if(userId !== id){
      return res.status(403).json({
        status: 403,
        message: "You are not authorized to update this user",
      });
    }
    const updatedUser = await updateUserService(id as string, data);

    return res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};


export const deleteUserController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();  
    if(userId !== id){
      return res.status(403).json({
        status: 403,
        message: "You are not authorized to delete this user",
      });
    }
    const deletedUser = await deleteUserService(id as string);
    return res.status(200).json({
      status: 200,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (err) {
    next(err);
  }
};