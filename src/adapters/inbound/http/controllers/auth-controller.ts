import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { Service, Inject } from "typedi";
import { SignUpUseCase } from "../../../../application/auth/sign-up.use-case.js";
import { SignInUseCase } from "../../../../application/auth/sign-in.use-case.js";

interface AuthenticatedRequest extends Request {
  user?: unknown;
}

@Service()
export class AuthController {
  constructor(
    @Inject(() => SignUpUseCase)
    private readonly signUpUseCase: SignUpUseCase,
    @Inject(() => SignInUseCase)
    private readonly signInUseCase: SignInUseCase,
  ) {}

  async signup(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password } = request.body;
      const user = await this.signUpUseCase.execute(email, password);
      response.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async signin(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password } = request.body;
      const result = await this.signInUseCase.execute(email, password);
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
