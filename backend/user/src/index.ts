import express from "express"
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import apiRouter from "./routes/index.js";

import { rateLimiter } from "./config/rateLimit.js";
import { ENV } from "./config/env.js";
import { connectToMongoDB } from "./config/mongoDB.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import connectToRedis from "./config/redisDB.js";
import {connectToRabbitMQ} from "./config/rabbitMQ.js";


const app = express();
const PORT = ENV.PORT;


await connectToMongoDB();
await connectToRedis();
await connectToRabbitMQ();

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({limit:"10kb"}));

app.use(rateLimiter);


app.use("/api/v1/",apiRouter);

app.use(errorHandler);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});