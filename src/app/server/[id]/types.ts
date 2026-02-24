export interface ServerMetrics {
  id: string;
  name: string;
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  lastUpdated?: string;
}

export interface ServerMetricHistory {
  cpu: number[];
  memory: number[];
  disk: number[];
}

export interface ServerMetricSample {
  id: string;
  serverId: string;
  cpu: number;
  memory: number;
  disk: number;
  createdAt: Date;
}
