'use client';

import { useState, useEffect } from 'react';

interface Server {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
}

export default function ServerMiniGrid() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setServers(data.systems || []);
      setError(null);
    } catch (err) {
      setError('Unable to reach server monitoring');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (cpu: number, mem: number) => {
    if (cpu > 90 || mem > 90) return 'bg-red-500';
    if (cpu > 70 || mem > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-medium text-white/70 mb-3">Servers</h3>
        <div className="flex items-center gap-2 text-white/50">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-medium text-white/70 mb-3">Servers</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-white/70 mb-3">Servers</h3>
      <div className="grid grid-cols-2 gap-2">
        {servers.slice(0, 4).map((server) => (
          <div
            key={server.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
          >
            <div className={`w-2 h-2 rounded-full ${getStatusColor(server.cpu, server.memory)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{server.name}</p>
              <p className="text-xs text-white/50">
                CPU: {server.cpu.toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
      {servers.length > 4 && (
        <p className="text-xs text-white/40 mt-2 text-center">
          +{servers.length - 4} more
        </p>
      )}
    </div>
  );
}
