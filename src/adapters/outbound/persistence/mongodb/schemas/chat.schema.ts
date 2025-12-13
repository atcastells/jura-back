import { z } from "zod";
import { ChatRole } from "../../../../../domain/entities/chat-message.js";

export const threadSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  userId: z.string(),
  title: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.nativeEnum(ChatRole),
  content: z.string(),
  createdAt: z.date(),
});

export type ThreadSchema = z.infer<typeof threadSchema>;
export type ChatMessageSchema = z.infer<typeof chatMessageSchema>;
