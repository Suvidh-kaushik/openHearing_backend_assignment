import express from "express";
import { createUserSchema, getUsersSchema, updateUserSchema } from "../middlewares/schemas/user.schema.js";
import { validateCreateUser, validateGetUsers, validateUpdateUser } from "../middlewares/validators/user.js";
import { createUserController, getUsersController, updateUserController } from "../controllers/user.js";
import { user } from "../models/userModel.js";
import { authenticate } from "../middlewares/authenticate.js";


const userRouter: express.Router = express.Router();


userRouter.post("/",authenticate,validateCreateUser(createUserSchema),createUserController);

userRouter.get("/",authenticate,validateGetUsers(getUsersSchema),getUsersController);

userRouter.patch("/:id",authenticate,validateUpdateUser(updateUserSchema),updateUserController);


export default userRouter;