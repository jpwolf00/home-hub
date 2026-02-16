'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ServerGrid from '@/components/ServerGrid';
import { ServerMetrics } from '@/components/ServerCard';
import AICopilotWidget from '@/components/widgets/AICopilotWidget';

interface ApiResponse {
  servers: ServerMetrics[];
  isStale?: boolean;
  usingFallback?: boolean;
  lastUpdated?: string;
}

export default function MissionControlPage() {
  const [servers, setServers] = useState<ServerMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchServers = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/servers', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setServers(data.servers || []);
      setLastUpdated(new Date());
      setIsStale(data.isStale || false);
      setUsingFallback(data.usingFallback || false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 30_000);
    return () => clearInterval(interval);
  }, [fetchServers]);

  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{ backgroundColor: 'oklch(0.15 0.02 260)', color: 'oklch(0.95 0.01 260)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-mono tracking-wider">
            MISSION CONTROL
          </h1>

          <button
            onClick={fetchServers}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors font-mono text-sm"
          >
            <span>Refresh</span>
            <span aria-hidden>⟳</span>
          </button>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 mb-6">
          {isStale && (
            <span className="px-2 py-1 text-xs font-mono bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
              ⚠ Stale Data
            </span>
          )}
          {usingFallback && (
            <span className="px-2 py-1 text-xs font-mono bg-red-500/20 text-red-400 rounded border border-red-500/30">
              ⚠ Using Fallback Data
            </span>
          )}
        </div>

        <div className="mb-6 text-sm font-mono text-gray-400">
          {loading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="text-red-400">Error: {error}</span>
          ) : (
            <span>
              Last updated:{' '}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'} (auto-refresh 30s)
            </span>
          )}
        </div>

        <ServerGrid servers={servers} />

        {/* AI Copilot */}
        <div className="mt-8">
          <AICopilotWidget />
        </div>
      </div>
    </div>
  );
}
