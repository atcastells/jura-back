import { signupSchema, signinSchema } from "./validation-schemas";

describe("Validation Schemas", () => {
  describe("signupSchema", () => {
    it("should validate correct signup data", () => {
      const validData = {
        email: "user@example.com",
        password: "SecurePass123",
        organizationId: "org_12345",
      };

      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "SecurePass123",
        organizationId: "org_12345",
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid email");
      }
    });

    it("should reject password without uppercase letter", () => {
      const invalidData = {
        email: "user@example.com",
        password: "weakpass123",
        organizationId: "org_12345",
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("uppercase");
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "user@example.com",
        password: "Pass1",
        organizationId: "org_12345",
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 8");
      }
    });

    it("should reject password without number", () => {
      const invalidData = {
        email: "user@example.com",
        password: "SecurePassword",
        organizationId: "org_12345",
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("number");
      }
    });

    it("should reject invalid organization ID format", () => {
      const invalidData = {
        email: "user@example.com",
        password: "SecurePass123",
        organizationId: "org@invalid!",
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Invalid organization ID",
        );
      }
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        email: "user@example.com",
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
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

      const result = signinSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid email");
      }
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "",
      };

      const result = signinSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Password is required",
        );
      }
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        email: "user@example.com",
      };

      const result = signinSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
