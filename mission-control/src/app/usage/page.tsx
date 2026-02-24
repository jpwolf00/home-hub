'use client';

import { useState, useEffect } from 'react';

interface UsageGlobal {
  range: { start: string; end: string };
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    totalTokens: number;
    errors: number;
  };
  errorRate: number;
  byProvider: { provider: string; requests: number; totalTokens: number }[];
}

interface AgentUsage {
  agentId: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  avgTokensPerRequest: number;
  topModels: string[];
  providers: Record<string, number>;
}

interface ModelUsage {
  model: string;
  provider: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  errorRate: number;
}

interface Alert {
  id: number;
  ts: string;
  severity: 'warning' | 'critical';
  ruleId: string;
  title: string;
  status: 'open' | 'acked' | 'resolved';
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export default function UsagePage() {
  const [range, setRange] = useState('24h');
  const [global, setGlobal] = useState<UsageGlobal | null>(null);
  const [agents, setAgents] = useState<AgentUsage[]>([]);
  const [models, setModels] = useState<ModelUsage[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [globalRes, agentsRes, modelsRes, alertsRes] = await Promise.all([
        fetch(`/api/usage/global?range=${range}`),
        fetch(`/api/usage/agents?range=${range}`),
        fetch(`/api/usage/models?range=${range}`),
        fetch('/api/usage/alerts?status=open'),
      ]);
      
      const globalData = await globalRes.json();
      const agentsData = await agentsRes.json();
      const modelsData = await modelsRes.json();
      const alertsData = await alertsRes.json();
      
      setGlobal(globalData);
      setAgents(agentsData.agents || agentsData || []);
      setModels(modelsData.models || modelsData || []);
      setAlerts(alertsData.alerts || alertsData || []);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetch('/api/usage/refresh', { method: 'POST' });
    await fetchData();
    setRefreshing(false);
  };

  const handleAlertAction = async (alertId: number, action: 'ack' | 'resolve') => {
    await fetch('/api/usage/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, action }),
    });
    fetchData();
  };

  if (loading && !global) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Model Usage</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Model Usage</h1>
        <div className="flex items-center gap-4">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-gray-800 border-gray-700 text-white"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Requests" value={global?.totals.requests || 0} format={formatNumber} />
        <KpiCard label="Input Tokens" value={global?.totals.inputTokens || 0} format={formatNumber} />
        <KpiCard label="Output Tokens" value={global?.totals.outputTokens || 0} format={formatNumber} />
        <KpiCard label="Errors" value={global?.totals.errors || 0} format={formatNumber} />
        <KpiCard label="Error Rate" value={global?.errorRate || 0} format={formatPercent} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Active Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded ${
                  alert.severity === 'critical' ? 'bg-red-900/30 border border-red-700' : 'bg-yellow-900/30 border border-yellow-700'
                }`}
              >
                <div>
                  <span className={`font-medium ${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                    [{alert.severity.toUpperCase()}]
                  </span>
                  <span className="ml-2 text-white">{alert.title}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAlertAction(alert.id, 'ack')}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Ack
                  </button>
                  <button
                    onClick={() => handleAlertAction(alert.id, 'resolve')}
                    className="px-3 py-1 text-sm bg-green-700 hover:bg-green-600 rounded"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Agent Breakdown */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-3">By Agent</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-2">Agent</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">Tokens</th>
                  <th className="text-right py-2">Avg</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.agentId} className="border-b border-gray-800">
                    <td className="py-2 text-white">{agent.agentId.replace('agent:', '')}</td>
                    <td className="text-right py-2 text-gray-300">{formatNumber(agent.requests)}</td>
                    <td className="text-right py-2 text-gray-300">{formatNumber(agent.totalTokens)}</td>
                    <td className="text-right py-2 text-gray-300">{formatNumber(agent.avgTokensPerRequest)}</td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Breakdown */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-3">By Model</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-2">Model</th>
                  <th className="text-left py-2">Provider</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">Tokens</th>
                  <th className="text-right py-2">Err%</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model, i) => (
                  <tr key={`${model.model}-${model.provider}-${i}`} className="border-b border-gray-800">
                    <td className="py-2 text-white">{model.model}</td>
                    <td className="py-2 text-gray-400">{model.provider}</td>
                    <td className="text-right py-2 text-gray-300">{formatNumber(model.requests)}</td>
                    <td className="text-right py-2 text-gray-300">{formatNumber(model.totalTokens)}</td>
                    <td className="text-right py-2 text-gray-300">{formatPercent(model.errorRate)}</td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* By Provider */}
      {global?.byProvider && global.byProvider.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-3">By Provider</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {global.byProvider.map((p) => (
              <div key={p.provider} className="bg-gray-800 rounded p-3">
                <div className="text-gray-400 text-sm">{p.provider}</div>
                <div className="text-xl font-semibold">{formatNumber(p.requests)} requests</div>
                <div className="text-gray-400 text-sm">{formatNumber(p.totalTokens)} tokens</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, format }: { label: string; value: number; format: (n: number) => string }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{format(value)}</div>
    </div>
  );
}
