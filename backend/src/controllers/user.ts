import type { NextFunction, Request, Response } from "express";
import { createUserService, getUsersService } from "../services/user.js";

export const createUserController = async(req:Request,res:Response,next:NextFunction) =>{
    try{
      
        const user = await createUserService(req.body);

        return res.status(201).json({
            status: 201,
            message: "User created successfully",
            data: user
        });

    }catch(err){
        console.error(err);
        next(err);
    }
}




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
