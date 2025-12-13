import { Service, Inject } from "typedi";
import { Request, Response } from "express";
import { ChatWithAgentUseCase } from "../../../../application/agents/chat-with-agent.use-case.js";
import { CreateAgentUseCase } from "../../../../application/agents/create-agent.use-case.js";
import { ListAgentsUseCase } from "../../../../application/agents/list-agents.use-case.js";
import { GetAgentUseCase } from "../../../../application/agents/get-agent.use-case.js";
import { z } from "zod";
import { AgentType } from "../../../../domain/entities/agent.js";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";

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

  async createAgent(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
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
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: error.issues });
      } else {
        console.error("Error creating agent:", error);
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  async listAgents(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const agents = await this.listAgentsUseCase.execute(authRequest.user.id);
    response.json(agents);
  }

  async getAgent(request: Request, response: Response): Promise<void> {
    const agentId = request.params.id;
    const agent = await this.getAgentUseCase.execute(agentId);

    if (!agent) {
      response.status(404).json({ error: "Agent not found" });
      return;
    }

    // Optional: Add authorization check here if relevant

    response.json(agent);
  }

  async chatWithAgent(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const agentId = request.params.id;

    try {
      const { message, threadId } = chatSchema.parse(request.body);
      const reply = await this.chatWithAgentUseCase.execute({
        agentId,
        userId: authRequest.user.id,
        message,
        threadId,
      });

      response.json({ message: reply });
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: error.issues });
      } else if (
        error instanceof Error &&
        (error.message === "Agent not found" ||
          error.message === "Thread not found")
      ) {
        response.status(404).json({ error: error.message });
      } else if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("disabled"))
      ) {
        response.status(403).json({ error: error.message });
      } else {
        console.error("Error chatting with agent:", error);
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  async createThread(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }
    const agentId = request.params.id;
    try {
      const { title } = createThreadSchema.parse(request.body);
      const thread = await this.createThreadUseCase.execute(
        authRequest.user.id,
        agentId,
        title,
      );
      response.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: error.issues });
      } else if (error instanceof Error && error.message.includes("disabled")) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  async listThreads(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }
    const agentId = request.params.id;
    const threads = await this.listThreadsUseCase.execute(
      authRequest.user.id,
      agentId,
    );
    response.json(threads);
  }

  async getThreadHistory(request: Request, response: Response): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }
    const threadId = request.params.threadId;
    try {
      const history = await this.getThreadHistoryUseCase.execute(
        authRequest.user.id,
        threadId,
      );
      response.json(history);
    } catch (error) {
      if (error instanceof Error && error.message === "Thread not found") {
        response.status(404).json({ error: "Thread not found" });
      } else {
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  }
}
