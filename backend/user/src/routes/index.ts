import express from "express";
import userRouter from "./user.js";
import authRouter from "./auth.js";


const apiRouter:express.Router = express.Router();


apiRouter.use("/users", userRouter);
apiRouter.use("/auth",  authRouter);




export default apiRouter;