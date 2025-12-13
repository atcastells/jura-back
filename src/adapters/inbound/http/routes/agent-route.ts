import { Router } from "express";
import { Container } from "typedi";
import { AgentController } from "../controllers/agent-controller.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

export const agentRoutes: Router = Router();

const agentController = Container.get(AgentController);

// All agent management routes require authentication
agentRoutes.use(authMiddleware.authenticate());

agentRoutes.post("/", (request, response) =>
  agentController.createAgent(request, response),
);
agentRoutes.get("/", (request, response) =>
  agentController.listAgents(request, response),
);
agentRoutes.get("/:id", (request, response) =>
  agentController.getAgent(request, response),
);
