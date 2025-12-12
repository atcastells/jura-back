import { Request, Response, NextFunction } from "express";
import { Service, Inject } from "typedi";
import { AuthService } from "../../../../domain/auth/auth-service.js";

interface AuthenticatedRequest extends Request {
  user?: unknown;
}

@Service()
export class AuthController {
  constructor(
    @Inject(() => AuthService) private readonly authService: AuthService,
  ) {}

  async signup(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password, organizationId } = request.body;
      const user = await this.authService.signup(
        email,
        password,
        organizationId,
      );
      response.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async signin(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password } = request.body;
      const result = await this.authService.signin(email, password);
      response.status(200).json(result);
    } catch (error) {
      next(error); // Might want to map error to specific status code
    }
  }

  async me(request: Request, response: Response, next: NextFunction) {
    try {
      // User is attached by middleware
      const user = (request as AuthenticatedRequest).user;
      if (!user) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }
      response.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
