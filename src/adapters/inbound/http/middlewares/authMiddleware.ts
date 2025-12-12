import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { AuthService } from '../../../../domain/auth/AuthService';
import { User } from '../../../../domain/user/User';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Authentication middleware using AuthService
 */
export class AuthMiddleware {
  /**
   * Middleware to verify authentication token
   * Extracts the token from Authorization header and validates it using AuthService
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
        const authService = Container.get(AuthService);

        // Verify token using AuthService
        const user = await authService.validateToken(token);

        if (!user) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token',
          });
          return;
        }

        // Attach user payload to request
        (req as AuthenticatedRequest).user = user;

        next();
      } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    };
  }

  /**
   * Middleware to check if user has required role
   * Note: Current User model might not have 'role' yet, so we cast to any for now
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

      // TODO: Update User interface to include role
      const userRole = (authReq.user as any).role;

      if (!userRole || !allowedRoles.includes(userRole)) {
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
        const authService = Container.get(AuthService);

        // Verify token using AuthService
        const user = await authService.validateToken(token);

        if (user) {
          (req as AuthenticatedRequest).user = user;
        }

        next();
      } catch {
        // If optional auth fails, just continue without user
        next();
      }
    };
  }
}

// Export a default instance for convenience
export const authMiddleware = new AuthMiddleware();
