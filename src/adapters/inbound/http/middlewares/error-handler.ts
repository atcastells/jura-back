import { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error.js";
import { ValidationError } from "./validate-request.js";

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  console.error("Error:", error);

  if (error instanceof ValidationError) {
    response.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (error.name === "ValidationError") {
    response.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error.name === "CastError") {
    response.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      success: false,
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
