import { initDb, countWorkflows, countAgents, queryEvents } from '@/lib/db';
import { env } from '@/lib/env';
import { ingestCoolify } from './coolify';
import { ingestSnapshot } from './snapshot';
import { ingestSeed } from './seed';
import { runtimeState, updateDataCounts, hasUsableData } from '@/lib/state';

let started = false;
let seededOnStartup = false;

export function startScheduler() {
  if (started) return;
  started = true;

  initDb();
  
  // Ingest from available sources
  ingestSnapshot();
  void ingestCoolify();
  
  // Check if we need to seed
  const workflowCount = countWorkflows();
  const agentCount = countAgents();
  const eventCount = queryEvents(10).length;
  updateDataCounts(workflowCount, agentCount, eventCount);
  
  // Seed if no data or snapshot missing
  if (!seededOnStartup && (!hasUsableData() || runtimeState.checks.snapshot === 'missing')) {
    ingestSeed();
    seededOnStartup = true;
    
    // Update counts after seeding
    const newWorkflowCount = countWorkflows();
    const newAgentCount = countAgents();
    updateDataCounts(newWorkflowCount, newAgentCount, eventCount);
  }

  setInterval(() => {
    ingestSnapshot();
    
    // Update data counts
    const wc = countWorkflows();
    const ac = countAgents();
    const ec = queryEvents(10).length;
    updateDataCounts(wc, ac, ec);
  }, env.pollMs).unref();

  setInterval(() => {
    void ingestCoolify();
  }, env.deployPollMs).unref();
  
  // Periodic seed check (every 5 minutes) in case data was lost
  setInterval(() => {
    const wc = countWorkflows();
    const ac = countAgents();
    updateDataCounts(wc, ac, queryEvents(10).length);
    
    if (!hasUsableData()) {
      ingestSeed();
    }
  }, 300000).unref();
}
