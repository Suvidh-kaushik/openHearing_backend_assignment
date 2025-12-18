import express from "express";
import { createUserSchema, deleteUserSchema, getUsersSchema, updateUserSchema } from "../middlewares/schemas/user.schema.js";
import { validateCreateUser, validateDeleteUser, validateGetUsers, validateUpdateUser } from "../middlewares/validators/user.js";
import { createUserController, deleteUserController, getUsersController, updateUserController } from "../controllers/user.js";
import { user } from "../models/userModel.js";
import { authenticate } from "../middlewares/authenticate.js";


const userRouter: express.Router = express.Router();


userRouter.post("/",authenticate,validateCreateUser(createUserSchema),createUserController);

userRouter.get("/",authenticate,validateGetUsers(getUsersSchema),getUsersController);

userRouter.patch("/:id",authenticate,validateUpdateUser(updateUserSchema),updateUserController);

userRouter.delete("/:id",authenticate,validateDeleteUser(deleteUserSchema),deleteUserController);


export default userRouter;