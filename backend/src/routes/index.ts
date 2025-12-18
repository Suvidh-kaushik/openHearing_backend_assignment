import express from "express";
import userRouter from "./user.js";


const apiRouter:express.Router = express.Router();


apiRouter.use("/users", userRouter);



export default apiRouter;