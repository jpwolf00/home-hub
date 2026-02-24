import React from 'react';
import ServerCard, { ServerMetrics } from './ServerCard';

interface ServerGridProps {
  servers: ServerMetrics[];
}

const ServerGrid: React.FC<ServerGridProps> = ({ servers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
};

export default ServerGrid;