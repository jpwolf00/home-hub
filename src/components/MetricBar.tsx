import React from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
  showValue?: boolean;
}

const MetricBar: React.FC<MetricBarProps> = ({ 
  label, 
  value, 
  color,
  showValue = true
}) => {
  // Ensure value is between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs uppercase tracking-wider mb-1">
        <span className="text-gray-400">{label}</span>
        {showValue && <span className="font-mono">{clampedValue}%</span>}
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${clampedValue}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default MetricBar;