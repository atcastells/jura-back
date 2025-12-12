import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "../controllers/auth-controller.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { validateRequest } from "../middlewares/validate-request.js";
import {
  signupSchema,
  signinSchema,
} from "../middlewares/validation-schemas.js";

const router: Router = Router();

// We need to bind the context because we are passing the method as a handler
// Use lazy resolution to ensure all dependencies are registered before instantiation
router.post(
  "/signup",
  validateRequest(signupSchema),
  (request, response, next) =>
    Container.get(AuthController).signup(request, response, next),
);
router.post(
  "/signin",
  validateRequest(signinSchema),
  (request, response, next) =>
    Container.get(AuthController).signin(request, response, next),
);
router.get("/me", authMiddleware.authenticate(), (request, response, next) =>
  Container.get(AuthController).me(request, response, next),
);

export { router as authRouter };
