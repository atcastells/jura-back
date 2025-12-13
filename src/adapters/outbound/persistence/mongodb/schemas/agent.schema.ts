import { z } from "zod";
import {
  AgentType,
  AgentStatus,
} from "../../../../../domain/entities/agent.js";

export const agentSchema = z.object({
  userId: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(AgentType),
  status: z.nativeEnum(AgentStatus).default(AgentStatus.ACTIVE),
  configuration: z.object({
    systemPrompt: z.string(),
    tone: z.string(),
    enableThreads: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentSchema = z.infer<typeof agentSchema>;
