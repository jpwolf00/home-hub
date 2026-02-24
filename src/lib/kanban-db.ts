import { prisma } from './prisma';

export type FeatureStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';
export type FeaturePriority = 'low' | 'medium' | 'high';

export type Feature = {
  id: string;
  title: string;
  description?: string;
  column: FeatureStatus;
  priority: FeaturePriority;
  agentId?: string;
  linkedSessionId?: string;
  tokensIn: number;
  tokensOut: number;
  lastPromptAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Map database model to API response
function toFeature(card: {
  id: string;
  title: string;
  description: string | null;
  column: string;
  priority: string;
  agentId: string | null;
  linkedSessionId: string | null;
  tokensIn: number;
  tokensOut: number;
  lastPromptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Feature {
  return {
    id: card.id,
    title: card.title,
    description: card.description ?? undefined,
    column: card.column as FeatureStatus,
    priority: card.priority as FeaturePriority,
    agentId: card.agentId ?? undefined,
    linkedSessionId: card.linkedSessionId ?? undefined,
    tokensIn: card.tokensIn,
    tokensOut: card.tokensOut,
    lastPromptAt: card.lastPromptAt ?? undefined,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export async function getFeatures(): Promise<Feature[]> {
  const cards = await prisma.kanbanCard.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return cards.map(toFeature);
}

export async function getFeatureById(id: string): Promise<Feature | null> {
  const card = await prisma.kanbanCard.findUnique({
    where: { id },
  });
  return card ? toFeature(card) : null;
}

export async function createFeature(
  title: string,
  description?: string,
  priority: FeaturePriority = 'medium'
): Promise<Feature> {
  const card = await prisma.kanbanCard.create({
    data: {
      title,
      description,
      column: 'planned',
      priority,
      tokensIn: 0,
      tokensOut: 0,
    },
  });
  return toFeature(card);
}

export async function updateFeature(
  id: string,
  patch: Partial<{
    title: string;
    description: string;
    column: FeatureStatus;
    priority: FeaturePriority;
    agentId: string;
    linkedSessionId: string;
    tokensIn: number;
    tokensOut: number;
    lastPromptAt: Date;
  }>
): Promise<Feature | null> {
  const card = await prisma.kanbanCard.update({
    where: { id },
    data: patch,
  });
  return card ? toFeature(card) : null;
}

export async function deleteFeature(id: string): Promise<boolean> {
  try {
    await prisma.kanbanCard.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getFeaturesByColumn(column: FeatureStatus): Promise<Feature[]> {
  const cards = await prisma.kanbanCard.findMany({
    where: { column },
    orderBy: { createdAt: 'desc' },
  });
  return cards.map(toFeature);
}
