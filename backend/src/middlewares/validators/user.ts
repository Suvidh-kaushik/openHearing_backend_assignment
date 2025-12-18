import {ZodError, type AnyZodObject } from "zod/v3";
import type { Request, Response, NextFunction } from "express";
import {createUserSchema, getUsersSchema } from "../schemas/user.schema.js";

export const validateCreateUser =
  (schema: typeof createUserSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
      });
      req.body = parsed.body;

      next();
    } catch (error) {
      console.error(error);
       return res.status(400).json({
          status: 400,
          message: "Input Validation Error",
        });
    }
  };


  export const validateGetUsers = (schema: typeof getUsersSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        query: req.query,
      });

      next();
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        status: 400,
        message: "Input Validation Error",
      });
    }
  };
