import { ENV } from "./env.js";
import { createClient, type RedisClientType } from "redis";

const redisClientUrl = ENV.REDIS_URL;

if (!redisClientUrl) {
    throw new Error("REDIS_URL environment variable is not set");
}

export const redisClient:RedisClientType= createClient({
    url: redisClientUrl,
});

const connectToRedis = async ()=>{
    try{
      await redisClient.connect();
      console.log("Redis has been connected successfully");
    }catch(error){
        console.error("Error while connecting to redis", error);
        process.exit(1);
    }
}

export default connectToRedis;