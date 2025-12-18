import { type Request, type Response,type NextFunction } from "express";
import { HttpError } from "http-errors";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
  }

  console.error(err);

  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
  });
};
