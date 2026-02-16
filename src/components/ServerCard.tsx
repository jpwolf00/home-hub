import React from 'react';
import Link from 'next/link';
import MetricBar from './MetricBar';

export interface ServerMetrics {
  id: string;
  name: string;
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
}

interface ServerCardProps {
  server: ServerMetrics;
}

const COLORS = {
  online: 'oklch(0.65 0.18 140)',
  offline: 'oklch(0.6 0.15 20)',
  cpu: 'oklch(0.7 0.15 200)',
  memory: 'oklch(0.7 0.15 280)',
  disk: 'oklch(0.7 0.15 45)',
};

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const isOnline = server.status === 'online';

  return (
    <Link href={`/server/${server.id}`}>
      <div
        className="rounded-lg border border-gray-700 bg-gray-900/60 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
        style={{ backgroundColor: 'oklch(0.2 0.02 260)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-wider font-mono text-white">
              {server.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isOnline ? COLORS.online : COLORS.offline }}
              />
              <span className="text-sm text-gray-300 font-mono">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <span className="text-gray-500 text-lg">→</span>
        </div>

        {isOnline ? (
          <div>
            <MetricBar label="CPU" value={server.cpu} color={COLORS.cpu} />
            <MetricBar label="MEM" value={server.memory} color={COLORS.memory} />
            <MetricBar label="DISK" value={server.disk} color={COLORS.disk} />
          </div>
        ) : (
          <div className="text-gray-500 font-mono text-sm">
            <div className="mb-2">CPU: --</div>
            <div className="mb-2">MEM: --</div>
            <div>DISK: --</div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ServerCard;
