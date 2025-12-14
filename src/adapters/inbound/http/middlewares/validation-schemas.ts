import { z } from "zod";

/**
 * Validation schema for signup endpoint
 * Based on OpenAPI specification requirements
 */
export const signupSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

/**
 * Validation schema for signin endpoint
 * Based on OpenAPI specification requirements
 */
export const signinSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Validation schema for document upload endpoint
 */
export const uploadDocumentSchema = z.object({
  category: z.enum([
    "resume",
    "cover_letter",
    "portfolio",
    "certification",
    "transcript",
    "reference",
    "other",
  ]),
});

/**
 * Type exports for TypeScript type inference
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
