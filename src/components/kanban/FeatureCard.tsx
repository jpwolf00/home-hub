'use client';
import { Feature, FeatureStatus } from '@/types/kanban';

interface FeatureCardProps {
  feature: Feature;
  onStatusChange: (id: string, status: FeatureStatus) => void;
}

const STATUS_COLORS: Record<FeatureStatus, string> = {
  planned: 'border-gray-500',
  in_progress: 'border-blue-500 bg-blue-500/10',
  completed: 'border-green-500 bg-green-500/10',
  on_hold: 'border-yellow-500 bg-yellow-500/10',
};

const STATUS_LABELS: Record<FeatureStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
};

export default function FeatureCard({ feature, onStatusChange }: FeatureCardProps) {
  return (
    <div className={`border-l-4 ${STATUS_COLORS[feature.status]} bg-gray-800/60 rounded-r-lg p-3 mb-2`}>
      <h3 className="font-semibold text-sm text-white">{feature.title}</h3>
      {feature.description && (
        <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
      )}
      {feature.status === 'in_progress' && feature.agentName && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-xs text-blue-400">Agent: {feature.agentName}</div>
          {feature.tokensIn !== undefined && (
            <div className="text-xs text-gray-400">
              Tokens: {feature.tokensIn?.toLocaleString()} in
            </div>
          )}
          {feature.lastPromptAt && (
            <div className="text-xs text-gray-500">
              Last: {feature.lastPromptAt}
            </div>
          )}
        </div>
      )}
      {feature.status === 'completed' && feature.completedAt && (
        <div className="mt-2 text-xs text-gray-500">
          Completed: {new Date(feature.completedAt).toLocaleString()}
        </div>
      )}
      <select
        className="mt-2 text-xs bg-gray-700 text-gray-300 rounded px-2 py-1"
        value={feature.status}
        onChange={(e) => onStatusChange(feature.id, e.target.value as FeatureStatus)}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
