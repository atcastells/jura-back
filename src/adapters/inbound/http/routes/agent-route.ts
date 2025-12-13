import { Router } from "express";
import { Container } from "typedi";
import { AgentController } from "../controllers/agent-controller.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

export const agentRoutes: Router = Router();

const agentController = Container.get(AgentController);

// All agent management routes require authentication
agentRoutes.use(authMiddleware.authenticate());

agentRoutes.post("/", (request, response, next) =>
  agentController.createAgent(request, response, next),
);
agentRoutes.get("/", (request, response, next) =>
  agentController.listAgents(request, response, next),
);
agentRoutes.get("/:id", (request, response, next) =>
  agentController.getAgent(request, response, next),
);
agentRoutes.post("/:id/chat", (request, response, next) =>
  agentController.chatWithAgent(request, response, next),
);
agentRoutes.post("/:id/threads", (request, response, next) =>
  agentController.createThread(request, response, next),
);
agentRoutes.get("/:id/threads", (request, response, next) =>
  agentController.listThreads(request, response, next),
);
agentRoutes.get("/:id/threads/:threadId", (request, response, next) =>
  agentController.getThreadHistory(request, response, next),
);
