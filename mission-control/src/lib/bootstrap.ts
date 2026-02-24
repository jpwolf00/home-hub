import { startScheduler } from './ingest/scheduler';

export function ensureBootstrapped() {
  startScheduler();
}
