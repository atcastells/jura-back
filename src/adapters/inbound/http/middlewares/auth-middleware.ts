import { Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import { ValidateTokenUseCase } from "../../../../application/auth/validate-token.use-case.js";
import { User } from "../../../../domain/user/user.js";

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Helper function to handle authentication logic
 */
async function validateAuthToken(
  authHeader: string | undefined,
): Promise<User | undefined> {
  if (!authHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const validateTokenUseCase = Container.get(ValidateTokenUseCase);

  const user = await validateTokenUseCase.execute(token);
  return user ?? undefined;
}

/**
 * Async handler for authenticate middleware
 */
async function handleAuthenticate(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Skip authentication for OPTIONS (CORS preflight) requests
    if (request.method === "OPTIONS") {
      next();
      return;
    }

    const user = await validateAuthToken(request.headers.authorization);

    if (!user) {
      response.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
      return;
    }

    // Attach user payload to request
    (request as AuthenticatedRequest).user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    response.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

/**
 * Async handler for optional auth middleware
 */
async function handleOptionalAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await validateAuthToken(request.headers.authorization);

    if (user) {
      (request as AuthenticatedRequest).user = user;
    }

    next();
  } catch {
    // If optional auth fails, just continue without user
    next();
  }
}

/**
 * Authentication middleware using ValidateTokenUseCase
 */
export class AuthMiddleware {
  /**
   * Middleware to verify authentication token
   * Extracts the token from Authorization header and validates it using ValidateTokenUseCase
   */
  authenticate() {
    return handleAuthenticate;
  }

  /**
   * Middleware to check if user has required role
   * Note: Role checking requires User interface to include 'role' field
   */
  requireRole(allowedRoles: string[]) {
    return (request: Request, response: Response, next: NextFunction): void => {
      const authRequest = request as AuthenticatedRequest;

      if (!authRequest.user) {
        response.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const userRole = (authRequest.user as User & { role?: string }).role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        response.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
        return;
      }

      next();
    };
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   * If a valid token is present, user payload is attached to request
   */
  optionalAuth() {
    return handleOptionalAuth;
  }
}

// Export a default instance for convenience
export const authMiddleware = new AuthMiddleware();
