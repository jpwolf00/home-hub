import { initDb } from '@/lib/db';
import { env } from '@/lib/env';
import { ingestCoolify } from './coolify';
import { ingestSnapshot } from './snapshot';

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  initDb();
  ingestSnapshot();
  void ingestCoolify();

  setInterval(() => {
    ingestSnapshot();
  }, env.pollMs).unref();

  setInterval(() => {
    void ingestCoolify();
  }, env.deployPollMs).unref();
}
