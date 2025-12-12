import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "../controllers/auth-controller.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

const router: Router = Router();

// We need to bind the context because we are passing the method as a handler
// Use lazy resolution to ensure all dependencies are registered before instantiation
router.post("/signup", (request, response, next) =>
  Container.get(AuthController).signup(request, response, next),
);
router.post("/signin", (request, response, next) =>
  Container.get(AuthController).signin(request, response, next),
);
router.get("/me", authMiddleware.authenticate(), (request, response, next) =>
  Container.get(AuthController).me(request, response, next),
);

export { router as authRouter };
