import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * User payload interface - can be extended based on your needs
 */
export interface UserPayload {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

/**
 * Strategy interface for token verification
 * Implement this to use different authentication providers
 */
export interface AuthStrategy {
  /**
   * Verify a token and return the user payload
   * @param token - The token to verify
   * @returns User payload or null if verification fails
   */
  verify(token: string): Promise<UserPayload | null>;
}

/**
 * Generic JWT authentication strategy
 * Uses JWT secret from environment variable
 */
export class JWTAuthStrategy implements AuthStrategy {
  private readonly jwtSecret: string;

  constructor(jwtSecretEnvVar = 'JWT_SECRET') {
    const secret = process.env[jwtSecretEnvVar];
    
    if (!secret) {
      throw new Error(`${jwtSecretEnvVar} environment variable not configured`);
    }
    
    this.jwtSecret = secret;
  }

  async verify(token: string): Promise<UserPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        sub?: string;
        id?: string;
        email?: string;
        role?: string;
        [key: string]: unknown;
      };

      // Extract user ID from standard JWT claims
      const userId = decoded.sub || decoded.id;
      
      if (!userId || typeof userId !== 'string') {
        return null;
      }

      return {
        id: userId,
        email: decoded.email,
        role: decoded.role,
        ...decoded, // Include any additional claims
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return null;
      }
      throw error;
    }
  }
}

/**
 * Generic authentication middleware
 * Can be configured with any AuthStrategy implementation
 */
export class AuthMiddleware {
  constructor(private readonly authStrategy: AuthStrategy) {}

  /**
   * Middleware to verify authentication token
   * Extracts the token from Authorization header and verifies it using the configured strategy
   */
  authenticate() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip authentication for OPTIONS (CORS preflight) requests
        if (req.method === 'OPTIONS') {
          next();
          return;
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            message: 'No authentication token provided',
          });
          return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token using the configured strategy
        const userPayload = await this.authStrategy.verify(token);

        if (!userPayload) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token',
          });
          return;
        }

        // Attach user payload to request
        (req as AuthenticatedRequest).user = userPayload;

        next();
      } catch (error) {
        console.error('Authentication error:', error);

        // Generic error fallback with more details in development
        res.status(500).json({
          success: false,
          message: 'Authentication error',
          ...(process.env.NODE_ENV === 'development' && error instanceof Error
            ? { error: error.message }
            : {}),
        });
      }
    };
  }

  /**
   * Middleware to check if user has required role
   */
  requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!authReq.user.role || !allowedRoles.includes(authReq.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
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
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          next();
          return;
        }

        const token = authHeader.substring(7);

        // Verify token using the configured strategy
        const userPayload = await this.authStrategy.verify(token);

        if (userPayload) {
          (req as AuthenticatedRequest).user = userPayload;
        }

        next();
      } catch {
        // If optional auth fails, just continue without user
        next();
      }
    };
  }
}
