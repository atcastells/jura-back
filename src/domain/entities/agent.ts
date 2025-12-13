export enum AgentType {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
}

export enum AgentStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export interface AgentConfiguration {
  systemPrompt: string;
  tone: string;
  enableThreads: boolean;
  // Future: contextScope, allowedTools, etc.
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  configuration: AgentConfiguration;
  createdAt: Date;
  updatedAt: Date;
}
