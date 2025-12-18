import type { CorsOptions } from "cors";
import { ENV } from "./env.js";

const allowedOrigins = [
    'http://localhost:3000',
    ENV.CORS_ORIGIN
];

export const corsConfig: CorsOptions = {
    origin: (origin,cb)=>{
        if(!origin || allowedOrigins.includes(origin)){
            cb(null,true);
        }
        else{
            cb(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};