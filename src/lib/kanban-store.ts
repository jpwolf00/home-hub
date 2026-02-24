import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'kanban.json');

export type FeatureStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';

export type Feature = {
  id: string;
  title: string;
  description?: string;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
  agentName?: string;
  tokensIn?: number;
  tokensOut?: number;
  lastPromptAt?: string;
  completedAt?: string;
};

async function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
}

export async function readFeatures(): Promise<Feature[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeFeatures(features: Feature[]): Promise<void> {
  await ensureDataDir();
  const tempFile = DATA_FILE + '.tmp';
  await fs.writeFile(tempFile, JSON.stringify(features, null, 2));
  await fs.rename(tempFile, DATA_FILE);
}

export async function createFeature(title: string, description?: string): Promise<Feature> {
  const features = await readFeatures();
  const now = new Date().toISOString();
  const feature: Feature = {
    id: crypto.randomUUID(),
    title,
    description,
    status: 'planned',
    createdAt: now,
    updatedAt: now,
  };
  features.push(feature);
  await writeFeatures(features);
  return feature;
}

export async function updateFeature(id: string, patch: Partial<Feature>): Promise<Feature | null> {
  const features = await readFeatures();
  const index = features.findIndex(f => f.id === id);
  if (index === -1) return null;
  
  features[index] = { ...features[index], ...patch, updatedAt: new Date().toISOString() };
  if (patch.status === 'completed' && !features[index].completedAt) {
    features[index].completedAt = new Date().toISOString();
  }
  await writeFeatures(features);
  return features[index];
}

export async function deleteFeature(id: string): Promise<boolean> {
  const features = await readFeatures();
  const filtered = features.filter(f => f.id !== id);
  if (filtered.length === features.length) return false;
  await writeFeatures(filtered);
  return true;
}
