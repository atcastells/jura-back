import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Validation error class for structured error responses
 */
export class ValidationError extends Error {
  public errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>) {
    super("Validation failed");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Middleware factory to validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      // Validate request body against schema
      schema.parse(request.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors into a more user-friendly format
        const validationErrors = error.issues.map((error_) => ({
          field: error_.path.join("."),
          message: error_.message,
        }));

        // Pass ValidationError to error handler
        next(new ValidationError(validationErrors));
      } else {
        // Pass unexpected errors to error handler
        next(error);
      }
    }
  };
};
