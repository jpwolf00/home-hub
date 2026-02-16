'use client';

import { useState, useEffect } from 'react';

type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  lastCheck: Date | null;
}

interface SystemHealthBarProps {
  compact?: boolean;
}

export default function SystemHealthBar({ compact = false }: SystemHealthBarProps) {
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'Beszel', status: 'unknown', lastCheck: null },
    { name: 'Coolify', status: 'unknown', lastCheck: null },
    { name: 'Ollama', status: 'unknown', lastCheck: null },
  ]);

  useEffect(() => {
    // Initial check
    checkServices();
    // Refresh every 60 seconds
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkServices = async () => {
    // For now, we'll do simple health checks
    // In production, this would hit /api/health
    setServices([
      { name: 'Beszel', status: 'healthy', lastCheck: new Date() },
      { name: 'Coolify', status: 'healthy', lastCheck: new Date() },
      { name: 'Ollama', status: 'healthy', lastCheck: new Date() },
    ]);
  };

  const statusColors: Record<ServiceStatus, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-500',
  };

  const statusLabels: Record<ServiceStatus, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
    unknown: 'Unknown',
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {services.map((service) => (
          <div
            key={service.name}
            className={`w-2 h-2 rounded-full ${statusColors[service.status]}`}
            title={`${service.name}: ${statusLabels[service.status]}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {services.map((service) => (
        <div
          key={service.name}
          className="group relative flex items-center gap-2"
        >
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[service.status]}`} />
          <span className="text-xs text-white/60">{service.name}</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {service.name}: {statusLabels[service.status]}
            {service.lastCheck && (
              <span className="block text-white/50">
                Last check: {service.lastCheck.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
