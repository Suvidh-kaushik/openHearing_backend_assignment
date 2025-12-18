import express from "express";
import { createUserSchema, getUsersSchema, updateUserSchema } from "../middlewares/schemas/user.schema.js";
import { validateCreateUser, validateGetUsers, validateUpdateUser } from "../middlewares/validators/user.js";
import { createUserController, getUsersController, updateUserController } from "../controllers/user.js";
import { user } from "../models/userModel.js";


const userRouter: express.Router = express.Router();


userRouter.post("/",validateCreateUser(createUserSchema),createUserController);

userRouter.get("/",validateGetUsers(getUsersSchema),getUsersController);

userRouter.patch("/:id",validateUpdateUser(updateUserSchema),updateUserController);


export default userRouter;