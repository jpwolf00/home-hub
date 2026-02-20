import { env } from './env';

export function isStalled(isoTime: string): boolean {
  const t = new Date(isoTime).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t > env.stalledMinutes * 60_000;
}
