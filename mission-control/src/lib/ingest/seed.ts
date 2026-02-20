import fs from 'node:fs';
import { env } from '@/lib/env';
import { runtimeState } from '@/lib/state';
import { upsertWorkflow, upsertAgent } from '@/lib/db';
import { insertEvent } from '@/lib/db';
import type { Workflow, Agent } from '@/lib/types';

function evt(level: 'info' | 'warn' | 'error', source: string, message: string, metadata?: unknown) {
  insertEvent({
    id: crypto.randomUUID(),
    type: 'ingestion',
    level,
    source,
    message,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date().toISOString(),
  });
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'seed-mission-control',
    title: 'Mission Control MVP',
    workflow: 'home-hub',
    status: 'In Progress',
    ownerAgent: 'system:ingestion',
    specPath: '/workspace/home-hub/mission-control',
    notes: 'Seeded from defaults - Mission Control hotfix fallback',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-home-hub',
    title: 'Home Hub Dashboard',
    workflow: 'home-hub',
    status: 'In Progress',
    ownerAgent: 'system:ingestion',
    specPath: '/workspace/home-hub/src',
    notes: 'Seeded from defaults - Main dashboard maintenance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-automation',
    title: 'Automation Workflows',
    workflow: 'automation',
    status: 'Planned',
    ownerAgent: 'system:ingestion',
    specPath: null,
    notes: 'Seeded from defaults - Future automation tasks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SYNTHETIC_AGENT: Agent = {
  sessionKey: 'system:ingestion',
  runId: null,
  model: null,
  runtimeSeconds: 0,
  status: 'running',
  lastSeen: new Date().toISOString(),
  workflow: 'home-hub',
  currentTaskId: 'mission-control-hotfix',
  updatedAt: new Date().toISOString(),
};

function parseBacklogSection(content: string): Workflow[] {
  const workflows: Workflow[] = [];
  // Match ### [id] Title or ### Title patterns
  const sectionRegex = /^###\s+\[?([^\]]+)\]?\s+(.+)$/gm;
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    const id = `seed-backlog-${match[1].trim()}`;
    const title = match[2].trim();
    
    // Determine status based on section context (simple heuristic)
    let status: Workflow['status'] = 'Planned';
    const sectionStart = match.index;
    const nextSection = content.indexOf('###', sectionStart + 3);
    const sectionContent = nextSection > 0 
      ? content.substring(sectionStart, nextSection) 
      : content.substring(sectionStart);
    
    if (sectionContent.toLowerCase().includes('done') || sectionContent.toLowerCase().includes('completed')) {
      status = 'Done';
    } else if (sectionContent.toLowerCase().includes('review')) {
      status = 'Review';
    } else if (sectionContent.toLowerCase().includes('progress') || sectionContent.toLowerCase().includes('dev')) {
      status = 'In Progress';
    } else if (sectionContent.toLowerCase().includes('blocked')) {
      status = 'Blocked';
    }
    
    workflows.push({
      id,
      title,
      workflow: 'backlog',
      status,
      ownerAgent: 'system:ingestion',
      specPath: null,
      notes: 'Seeded from BACKLOG.md',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return workflows;
}

export function ingestSeed() {
  const now = new Date().toISOString();
  let seeded = false;
  
  // Try to seed from BACKLOG.md
  if (env.enableBacklogSeed) {
    try {
      if (fs.existsSync(env.backlogPath)) {
        const content = fs.readFileSync(env.backlogPath, 'utf8');
        const backlogWorkflows = parseBacklogSection(content);
        
        if (backlogWorkflows.length > 0) {
          for (const wf of backlogWorkflows) {
            upsertWorkflow(wf);
          }
          runtimeState.activeSources.add('seed');
          runtimeState.checks.seed = 'ok';
          evt('info', 'seed', `Seeded ${backlogWorkflows.length} workflows from BACKLOG.md`);
          seeded = true;
        }
      } else {
        evt('warn', 'seed', 'BACKLOG.md not found, using defaults', { path: env.backlogPath });
      }
    } catch (error) {
      evt('error', 'seed', 'Failed to seed from BACKLOG.md', { error: String(error) });
      runtimeState.checks.seed = 'failed';
    }
  }
  
  // If no backlog seeding, use defaults
  if (!seeded && env.minSeedItems > 0) {
    try {
      // Try custom defaults from env
      if (env.seedDefaultsJson) {
        const customDefaults = JSON.parse(env.seedDefaultsJson) as Workflow[];
        for (const wf of customDefaults) {
          upsertWorkflow({
            ...wf,
            id: `seed-custom-${wf.id}`,
            createdAt: now,
            updatedAt: now,
          });
        }
        evt('info', 'seed', `Seeded ${customDefaults.length} workflows from MC_SEED_DEFAULTS_JSON`);
      } else {
        // Use built-in defaults
        for (const wf of DEFAULT_WORKFLOWS) {
          upsertWorkflow(wf);
        }
        evt('info', 'seed', 'Seeded default workflows', { count: DEFAULT_WORKFLOWS.length });
      }
      
      runtimeState.activeSources.add('seed');
      runtimeState.checks.seed = 'ok';
      seeded = true;
    } catch (error) {
      evtseed', 'Failed('error', ' to seed defaults', { error: String(error) });
      runtimeState.checks.seed = 'failed';
    }
  }
  
  // Always add synthetic agent for display
  try {
    upsertAgent(SYNTHETIC_AGENT);
    runtimeState.activeSources.add('seed');
    evt('info', 'seed', 'Added synthetic ingestion agent');
error) {
    // Ignore - agent upsert may fail but  } catch ( that's ok
  }
  
  return seeded;
}
