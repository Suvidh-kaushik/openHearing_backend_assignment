import express from "express";
import { createUserSchema, getUsersSchema } from "../middlewares/schemas/user.schema.js";
import { validateCreateUser, validateGetUsers } from "../middlewares/validators/user.js";
import { createUserController, getUsersController } from "../controllers/user.js";


const userRouter: express.Router = express.Router();


userRouter.post("/",validateCreateUser(createUserSchema),createUserController);

userRouter.get("/",validateGetUsers(getUsersSchema),getUsersController);




export default userRouter;