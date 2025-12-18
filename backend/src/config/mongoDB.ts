import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectToMongoDB = async()=>{
    const url = ENV.MONGODB_URL;

    if(!url){
        throw new Error("MONGODB_URL is not defined in environment variables");
    }

    try{
       await mongoose.connect(url,{
         dbName: "API_MAKING"
       });
        console.log("MongoDB has been connected successfully .... ");
    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}
