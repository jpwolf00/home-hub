export type FeatureStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold'

export type Feature = {
  id: string
  title: string
  description?: string
  status: FeatureStatus
  createdAt: string
  updatedAt: string

  // For in_progress items
  agentId?: string
  agentName?: string
  tokensIn?: number
  tokensOut?: number
  lastPromptAt?: string

  // For completed items
  completedAt?: string
}

export type KanbanGrouped = Record<FeatureStatus, Feature[]>
