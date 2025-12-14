import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "../controllers/auth-controller.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { validateRequest } from "../middlewares/validate-request.js";
import {
  signupSchema,
  signinSchema,
} from "../middlewares/validation-schemas.js";

export const createAuthRouter = (): Router => {
  const router: Router = Router();
  const authController = Container.get(AuthController);

  router.post(
    "/signup",
    validateRequest(signupSchema),
    (request, response, next) =>
      authController.signup(request, response, next),
  );
  router.post(
    "/signin",
    validateRequest(signinSchema),
    (request, response, next) =>
      authController.signin(request, response, next),
  );
  router.get("/me", authMiddleware.authenticate(), (request, response, next) =>
    authController.me(request, response, next),
  );

  return router;
};
