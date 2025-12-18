import jwt, { type JwtPayload } from "jsonwebtoken"
import dotenv from "dotenv"
import type { Response } from "express";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateToken=(userId:string,res:Response)=>{
    const token=jwt.sign({userId},JWT_SECRET,{
        expiresIn:"15d" // in how many days does token expire
    });

  // creating a cookie and storing the token there instead of localstorage

    res.cookie("jwt",token,{
        maxAge:15*24*60*60*1000, //in count of millie seconds 
        httpOnly:true,// prevents XSS attacks cross-site scripting attacks 
        sameSite:"none",
        secure:true // only over https
    });
}


export const verifyJWTtoken = async(token:string)=>{
    return jwt.verify(token,JWT_SECRET) as JwtPayload;
}