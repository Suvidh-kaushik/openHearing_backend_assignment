import express from "express";
import { loginUser, verifyUser } from "../controllers/auth.js";


const authRouter: express.Router = express.Router();

authRouter.post('/login', loginUser);
authRouter.post('/verify', verifyUser);


export default authRouter;