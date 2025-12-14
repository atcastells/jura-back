import { z } from "zod";
import {
  signupSchema,
  signinSchema,
  uploadDocumentSchema,
} from "./validation-schemas";

const testInvalid = <T extends z.ZodType>(
  schema: T,
  data: unknown,
  expectedMessage?: string,
) => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (!result.success && expectedMessage) {
    expect(result.error.issues[0].message).toContain(expectedMessage);
  }
};

describe("Validation Schemas", () => {
  describe("signupSchema", () => {
    it("should validate correct signup data", () => {
      const validData = {
        email: "user@example.com",
        password: "SecurePass123",
      };

      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "SecurePass123",
      };
      testInvalid(signupSchema, invalidData, "Invalid email");
    });

    it("should reject password without uppercase letter", () => {
      const invalidData = {
        email: "user@example.com",
        password: "weakpass123",
      };
      testInvalid(signupSchema, invalidData, "uppercase");
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "user@example.com",
        password: "Pass1",
      };
      testInvalid(signupSchema, invalidData, "at least 8");
    });

    it("should reject password without number", () => {
      const invalidData = {
        email: "user@example.com",
        password: "SecurePassword",
      };
      testInvalid(signupSchema, invalidData, "number");
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        email: "user@example.com",
      };
      testInvalid(signupSchema, invalidData);
    });
  });

  describe("signinSchema", () => {
    it("should validate correct signin data", () => {
      const validData = {
        email: "user@example.com",
        password: "anypassword",
      };

      const result = signinSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password",
      };
      testInvalid(signinSchema, invalidData, "Invalid email");
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "",
      };
      testInvalid(signinSchema, invalidData, "Password is required");
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        email: "user@example.com",
      };
      testInvalid(signinSchema, invalidData);
    });
  });

  describe("uploadDocumentSchema", () => {
    it("should validate all valid document categories", () => {
      const validCategories = [
        "resume",
        "cover_letter",
        "portfolio",
        "certification",
        "transcript",
        "reference",
        "other",
      ];

      for (const category of validCategories) {
        const validData = { category };
        const result = uploadDocumentSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing category (required)", () => {
      const invalidData = {};
      testInvalid(uploadDocumentSchema, invalidData);
    });

    it("should reject invalid category", () => {
      const invalidData = {
        category: "invalid_category",
      };
      testInvalid(uploadDocumentSchema, invalidData);
    });

    it("should reject empty string category", () => {
      const invalidData = {
        category: "",
      };
      testInvalid(uploadDocumentSchema, invalidData);
    });

    it("should reject number as category", () => {
      const invalidData = {
        category: 123,
      };
      testInvalid(uploadDocumentSchema, invalidData);
    });
  });
});
