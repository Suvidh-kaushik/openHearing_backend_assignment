import { publishToQueue } from "../config/rabbitMQ.js";
import { redisClient } from "../config/redisDB.js";
import  {user}  from "../models/userModel.js";
import type { Request, Response } from "express";
import { generateToken } from "../utils/generateToken.js"

export const loginUser = async (req:Request, res:Response) => {
  try{
  const { email } = req.body;

  const rateLimitKey = `otp:ratelimit:${email}`;
  const rateLimit = await redisClient.get(rateLimitKey);
  if (rateLimit) {
    res.status(429).json({
      message: "Too may requests. Please wait before requesting new opt",
    });
    return;
  }

  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, {
    EX: 300,
  });

  const message = {
    to: email,
    subject: "OTP for Login",
    body: `Your OTP is ${otp}. It is valid for 5 minutes`,
  };

  await publishToQueue("send-mail", message);

  res.status(200).json({
    message: "OTP sent to your mail",
  });
}catch(error){
  console.error(error);
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
  });
}}


export const verifyUser = async (req:Request, res:Response) => {
 try{
  const { email, otp: enteredOtp } = req.body;

  if (!email || !enteredOtp) {
    return res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }

  const otpKey = `otp:${email}`;

  const storedOtp = await redisClient.get(otpKey);
  console.log(storedOtp, enteredOtp);
  if (!storedOtp || storedOtp != enteredOtp) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }

  await redisClient.del(otpKey);

  let userData = await user.findOne({ email });

  if(!userData){
     userData = await user.create({ email,isVerified:true });
  }


  const userId = userData._id.toString();
  const token = generateToken(userId, res);

  return res.status(200).json({
    message: "User Verified",
    user: userData,
    token: token,
  });

}catch(error){
  console.error(error);
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
  });
}
}

export const logout = async(req:Request, res:Response)=>{
  try{
   res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return res.status(200).json({ message: "Logged out successfully" });
}catch(error:any){
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
  });
}};

