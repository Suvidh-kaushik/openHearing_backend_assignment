import type { NextFunction, Request, Response } from "express";
import { createUserService, getUsersService, updateUserService } from "../services/user.js";
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
    const data = req.body;

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