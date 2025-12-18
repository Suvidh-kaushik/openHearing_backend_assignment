import type { NextFunction,Request,Response } from "express";
import { verifyJWTtoken } from "../utils/generateToken.js";
import { user, type IUser } from "../models/userModel.js";


export interface AuthenticatedRequest extends Request{
    user?: IUser;
}

export const authenticate = async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
 try{
    const token = req.cookies?.jwt;
    if(!token){
        return res.status(401).json({
            message:"You are not authenticated"
        });
    }

    const decodedToken = await verifyJWTtoken(token);
    if(!decodedToken){
        return res.status(401).json({
            message:"Invalid Token"
        });
    }
    const existingUser = await user.findOne({_id:decodedToken.userId});
    if(!existingUser){
        return res.status(404).json({
            message:"User not found"
        });
    }

    req.user = existingUser;
    next();
}catch(error:any){
    return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
    });
}
};