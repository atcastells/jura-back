import { Service, Inject } from "typedi";
import { Request, Response, NextFunction } from "express";
import { ChatWithAgentUseCase } from "../../../../application/agents/chat-with-agent.use-case.js";
import { CreateAgentUseCase } from "../../../../application/agents/create-agent.use-case.js";
import { ListAgentsUseCase } from "../../../../application/agents/list-agents.use-case.js";
import { GetAgentUseCase } from "../../../../application/agents/get-agent.use-case.js";
import { z } from "zod";
import { AgentType } from "../../../../domain/entities/agent.js";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";
import { HttpError } from "../errors/http-error.js";

import { CreateThreadUseCase } from "../../../../application/chat/create-thread.use-case.js";
import { ListThreadsUseCase } from "../../../../application/chat/list-threads.use-case.js";
import { GetThreadHistoryUseCase } from "../../../../application/chat/get-thread-history.use-case.js";

const createAgentSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AgentType),
  instructions: z.string(),
  tone: z.string(),
  enableThreads: z.boolean().optional().default(false),
});

const chatSchema = z.object({
  message: z.string().min(1),
  threadId: z.string().optional(),
});

const createThreadSchema = z.object({
  title: z.string().optional(),
});

@Service()
export class AgentController {
  constructor(
    @Inject(() => CreateAgentUseCase)
    private readonly createAgentUseCase: CreateAgentUseCase,
    @Inject(() => ListAgentsUseCase)
    private readonly listAgentsUseCase: ListAgentsUseCase,
    @Inject(() => GetAgentUseCase)
    private readonly getAgentUseCase: GetAgentUseCase,
    @Inject(() => ChatWithAgentUseCase)
    private readonly chatWithAgentUseCase: ChatWithAgentUseCase,
    @Inject(() => CreateThreadUseCase)
    private readonly createThreadUseCase: CreateThreadUseCase,
    @Inject(() => ListThreadsUseCase)
    private readonly listThreadsUseCase: ListThreadsUseCase,
    @Inject(() => GetThreadHistoryUseCase)
    private readonly getThreadHistoryUseCase: GetThreadHistoryUseCase,
  ) {}

  async createAgent(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const input = createAgentSchema.parse(request.body);
      // Map input to AgentConfiguration structure expected by use case
      const useCaseInput = {
        name: input.name,
        type: input.type,
        configuration: {
          systemPrompt: input.instructions,
          tone: input.tone,
          enableThreads: input.enableThreads,
        },
      };

      const agent = await this.createAgentUseCase.execute(
        authRequest.user.id,
        useCaseInput,
      );
      response.status(201).json(agent);
    } catch (error) {
      next(error);
    }
  }

  async listAgents(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const agents = await this.listAgentsUseCase.execute(authRequest.user.id);
      response.json(agents);
    } catch (error) {
      next(error);
    }
  }

  async getAgent(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const agentId = request.params.id;
      const agent = await this.getAgentUseCase.execute(agentId);

      if (!agent) {
        throw new HttpError(404, "Agent not found");
      }

      // Optional: Add authorization check here if relevant

      response.json(agent);
    } catch (error) {
      next(error);
    }
  }

  async chatWithAgent(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const agentId = request.params.id;
      const { message, threadId } = chatSchema.parse(request.body);
      const reply = await this.chatWithAgentUseCase.execute({
        agentId,
        userId: authRequest.user.id,
        message,
        threadId,
      });

      response.json({ message: reply });
    } catch (error) {
      next(error);
    }
  }

  async createThread(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }
      const agentId = request.params.id;
      const { title } = createThreadSchema.parse(request.body);
      const thread = await this.createThreadUseCase.execute(
        authRequest.user.id,
        agentId,
        title,
      );
      response.status(201).json(thread);
    } catch (error) {
      next(error);
    }
  }

  async listThreads(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }
      const agentId = request.params.id;
      const threads = await this.listThreadsUseCase.execute(
        authRequest.user.id,
        agentId,
      );
      response.json(threads);
    } catch (error) {
      next(error);
    }
  }

  async getThreadHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }
      const threadId = request.params.threadId;
      const history = await this.getThreadHistoryUseCase.execute(
        authRequest.user.id,
        threadId,
      );
      response.json(history);
    } catch (error) {
      next(error);
    }
  }
}
