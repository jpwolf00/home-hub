'use client';

import { useState, useEffect } from 'react';

type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  lastCheck: Date | null;
  latency?: number;
  error?: string;
}

interface SystemHealthBarProps {
  compact?: boolean;
}

// Service endpoints
const SERVICES = {
  Beszel: { url: 'http://192.168.85.199:8090/api/health', timeout: 5000 },
  Coolify: { url: 'http://192.168.85.202:8000/api/v1', timeout: 5000 },
  Ollama: { url: 'http://192.168.85.195:11434/api/tags', timeout: 5000 },
} as const;

async function checkService(
  name: keyof typeof SERVICES
): Promise<{ status: ServiceStatus; latency?: number; error?: string }> {
  const service = SERVICES[name];
  const start = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout);
    
    const res = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    
    if (res.ok) {
      return { status: 'healthy', latency };
    } else if (res.status >= 500) {
      return { status: 'down', error: `HTTP ${res.status}` };
    } else {
      // 400/401/403 errors mean service is up but something's off
      return { status: 'degraded', latency, error: `HTTP ${res.status}` };
    }
  } catch (error) {
    const latency = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Connection failed';
    
    // Timeout or connection refused
    if (message.includes('abort') || message.includes('network') || message.includes('refused')) {
      return { status: 'down', latency, error: message };
    }
    
    return { status: 'unknown', latency, error: message };
  }
}

export default function SystemHealthBar({ compact = false }: SystemHealthBarProps) {
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'Beszel', status: 'unknown', lastCheck: null },
    { name: 'Coolify', status: 'unknown', lastCheck: null },
    { name: 'Ollama', status: 'unknown', lastCheck: null },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const checkServices = async () => {
    setIsChecking(true);
    
    const results = await Promise.all(
      ['Beszel', 'Coolify', 'Ollama'].map(async (name) => {
        const result = await checkService(name as keyof typeof SERVICES);
        return {
          name,
          status: result.status,
          lastCheck: new Date(),
          latency: result.latency,
          error: result.error,
        };
      })
    );
    
    setServices(results);
    setIsChecking(false);
  };

  useEffect(() => {
    checkServices();
    // Refresh every 60 seconds
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, []);

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
            className={`w-2 h-2 rounded-full ${statusColors[service.status]} ${
              isChecking ? 'animate-pulse' : ''
            }`}
            title={`${service.name}: ${statusLabels[service.status]}${
              service.latency ? ` (${service.latency}ms)` : ''
            }`}
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
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[service.status]} ${isChecking ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-white/60">{service.name}</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="font-medium">{service.name}: {statusLabels[service.status]}</div>
            {service.latency && (
              <div className="text-white/50">Latency: {service.latency}ms</div>
            )}
            {service.error && (
              <div className="text-yellow-400">{service.error}</div>
            )}
            {service.lastCheck && (
              <div className="text-white/50">
                Last check: {service.lastCheck.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
