import { Router } from "express";
import { Container } from "typedi";
import { ProfileController } from "../controllers/profile-controller.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

export const createProfileRouter = (): Router => {
  const profileRoutes: Router = Router();
  const profileController = Container.get(ProfileController);

  // All profile routes require authentication
  profileRoutes.use(authMiddleware.authenticate());

  // Profile management
  profileRoutes.get("/me", (request, response, next) =>
    profileController.getMyProfile(request, response, next),
  );
  profileRoutes.patch("/me", (request, response, next) =>
    profileController.updateMyProfile(request, response, next),
  );

  // Role management
  profileRoutes.post("/me/roles", (request, response, next) =>
    profileController.addRole(request, response, next),
  );
  profileRoutes.patch("/me/roles/:roleId", (request, response, next) =>
    profileController.updateRole(request, response, next),
  );
  profileRoutes.delete("/me/roles/:roleId", (request, response, next) =>
    profileController.deleteRole(request, response, next),
  );

  return profileRoutes;
};
