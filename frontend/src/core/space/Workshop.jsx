import React, { useEffect } from 'react';

import { useFlowState } from '../hooks/useFlowState';

import './Workshop.css';

interface Tool {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface WorkshopProps {
  onToolSelect?: (toolId: string) => void;
  onMetricsUpdate?: (metrics: any) => void;
}

const WORKSHOP_TOOLS: Tool[] = [
  { id: 'code', name: 'Code', icon: '⌨️', category: 'creation' },
  { id: 'test', name: 'Test', icon: '🧪', category: 'quality' },
  { id: 'debug', name: 'Debug', icon: '🔍', category: 'maintenance' },
  { id: 'build', name: 'Build', icon: '🔨', category: 'creation' },
  { id: 'deploy', name: 'Deploy', icon: '🚀', category: 'delivery' },
  { id: 'monitor', name: 'Monitor', icon: '📊', category: 'maintenance' }
];

export const Workshop: React.FC<WorkshopProps> = ({
  onToolSelect,
  onMetricsUpdate
}) => {

  const { flowState, startFlow, updateIntensity } = useFlowState();


  // Auto-start flow state when entering workshop
  useEffect(() => {
    if (currentSpace.type === 'workshop' && !flowState.active) {
      startFlow();
    }
  }, [currentSpace.type, flowState.active, startFlow]);

  // Monitor and update metrics
  useEffect(() => {
    if (currentSpace.type === 'workshop') {
      const metrics = {
        flow: flowState.metrics,
        protection: protection.metrics,
        space: currentSpace
      };
      onMetricsUpdate?.(metrics);
    }
  }, [currentSpace, flowState.metrics, protection.metrics, onMetricsUpdate]);

  const handleToolSelect = (toolId: string) => {
    // Increase flow intensity for complex tools
    if (['code', 'debug'].includes(toolId)) {
      updateIntensity('high');
    }
    onToolSelect?.(toolId);
  };

  return (
    <div className="workshop">
      <div className="workshop-header">
        <h1>Workshop</h1>
        <div className="flow-status">
          <span className={`status ${flowState.active ? 'active' : ''}`}>
            {flowState.active ? 'In Flow' : 'Ready'}
          </span>
          <span className="intensity">{flowState.intensity}</span>
        </div>
      </div>

      <div className="tools-grid">
        {WORKSHOP_TOOLS.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${tool.category}`}
            onClick={() => handleToolSelect(tool.id)}
            disabled={!flowState.active}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-name">{tool.name}</span>
          </button>
        ))}
      </div>

      <div className="metrics-panel">
        <div className="metric">
          <label>Flow</label>
          <progress value={flowState.metrics.velocity} max={1} />
        </div>
        <div className="metric">
          <label>Focus</label>
          <progress value={flowState.metrics.focus} max={1} />
        </div>
        <div className="metric">
          <label>Energy</label>
          <progress value={flowState.metrics.energy} max={1} />
        </div>
        <div className="metric">
          <label>Protection</label>
          <progress value={protection.metrics.stability} max={1} />
        </div>
      </div>
    </div>
  );
}; 