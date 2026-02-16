'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MetricBar from '@/components/MetricBar';
import { ServerMetrics, ServerMetricHistory } from './types';

// Simple SVG Sparkline component
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) {
    return <div className="h-10 flex items-center justify-center text-gray-500 text-xs">No data</div>;
  }

  const width = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ServerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [server, setServer] = useState<ServerMetrics | null>(null);
  const [history, setHistory] = useState<ServerMetricHistory>({ cpu: [], memory: [], disk: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const fetchServerData = useCallback(async () => {
    if (!resolvedParams) return;
    
    try {
      setError(null);
      const res = await fetch(`/api/servers/${resolvedParams.id}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setServer(data.server);
      setHistory(data.history || { cpu: [], memory: [], disk: [] });
      setIsStale(data.isStale || false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch server');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams]);

  useEffect(() => {
    if (resolvedParams) {
      fetchServerData();
      const interval = setInterval(fetchServerData, 30_000);
      return () => clearInterval(interval);
    }
  }, [resolvedParams, fetchServerData]);

  if (!resolvedParams) return null;

  const isOnline = server?.status === 'online';

  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{ backgroundColor: 'oklch(0.15 0.02 260)', color: 'oklch(0.95 0.01 260)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-3 rounded-lg border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors text-xl"
              aria-label="Go back"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold font-mono tracking-wider">
              {server?.name || 'SERVER'}
            </h1>
            {isStale && (
              <span className="px-2 py-1 text-xs font-mono bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                ⚠ Stale Data
              </span>
            )}
          </div>

          <button
            onClick={fetchServerData}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors font-mono text-sm"
          >
            <span>Refresh</span>
            <span aria-hidden>⟳</span>
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-mono text-sm">
            Error: {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-gray-400 font-mono">
            Loading server data...
          </div>
        )}

        {/* Server details */}
        {!loading && server && (
          <div className="space-y-6">
            {/* Status Card */}
            <div
              className="rounded-lg border border-gray-700 bg-gray-900/60 p-6"
              style={{ backgroundColor: 'oklch(0.2 0.02 260)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-lg font-mono">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {isOnline ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CPU */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 uppercase tracking-wider">CPU</span>
                      <span className="font-mono">{server.cpu}%</span>
                    </div>
                    <Sparkline data={history.cpu} color="oklch(0.7 0.15 200)" />
                  </div>

                  {/* Memory */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 uppercase tracking-wider">Memory</span>
                      <span className="font-mono">{server.memory}%</span>
                    </div>
                    <Sparkline data={history.memory} color="oklch(0.7 0.15 280)" />
                  </div>

                  {/* Disk */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 uppercase tracking-wider">Disk</span>
                      <span className="font-mono">{server.disk}%</span>
                    </div>
                    <Sparkline data={history.disk} color="oklch(0.7 0.15 45)" />
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 font-mono">
                  Server is offline. Metrics unavailable.
                </div>
              )}
            </div>

            {/* No history message */}
            {history.cpu.length === 0 && isOnline && (
              <div className="text-center py-8 text-gray-500 font-mono text-sm">
                No history data yet. Metrics will be recorded over time.
              </div>
            )}

            {/* Historical Metrics Bars */}
            {history.cpu.length > 0 && isOnline && (
              <div
                className="rounded-lg border border-gray-700 bg-gray-900/60 p-6"
                style={{ backgroundColor: 'oklch(0.2 0.02 260)' }}
              >
                <h2 className="text-lg font-bold font-mono tracking-wider mb-4">
                  Current Metrics
                </h2>
                <MetricBar label="CPU" value={server.cpu} color="oklch(0.7 0.15 200)" />
                <MetricBar label="Memory" value={server.memory} color="oklch(0.7 0.15 280)" />
                <MetricBar label="Disk" value={server.disk} color="oklch(0.7 0.15 45)" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
