export type WorkflowStatus = 'Planned' | 'In Progress' | 'Review' | 'Blocked' | 'Done';
export type AgentStatus = 'idle' | 'running' | 'blocked' | 'error' | 'offline' | 'completed';

export interface Workflow {
  id: string;
  title: string;
  workflow: string;
  status: WorkflowStatus;
  ownerAgent: string | null;
  specPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  sessionKey: string;
  runId: string | null;
  model: string | null;
  runtimeSeconds: number;
  status: AgentStatus;
  lastSeen: string;
  workflow: string | null;
  currentTaskId: string | null;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadataJson: string | null;
  createdAt: string;
}
