import React, { useState, useEffect } from 'react';
import { Space, SpaceType } from '../types';
import { ProtectionState } from '../types/protection';
import { useFlowState } from '../hooks/useFlowState';
import { useProtection } from '../hooks/useProtection';
import './Commons.css';

interface CommonsProps {
  onStateChange?: (state: Partial<Space>) => void;
  onProtectionTrigger?: (violation: any) => void;
}

const defaultProtection: Partial<ProtectionState> = {
  active: true,
  metrics: {
    stability: 0.8,    // High stability for collaboration
    resilience: 0.9,   // High resilience for experimentation
    integrity: 0.9,    // High integrity for shared resources
    immunity: 0.7      // High immunity for community knowledge
  }
};

interface Resource {
  id: string;
  name: string;
  type: 'knowledge' | 'tool' | 'pattern' | 'template';
  usage: number;
  quality: number;
}

export const Commons: React.FC<CommonsProps> = ({
  onStateChange,
  onProtectionTrigger
}) => {
  const { flowState, startFlow, endFlow, updateIntensity } = useFlowState();
  const { protection, checkHealth } = useProtection();
  
  const [activeResources, setActiveResources] = useState<string[]>([]);
  const [resources] = useState<Resource[]>([
    { id: 'k1', name: 'Flow Patterns', type: 'pattern', usage: 85, quality: 90 },
    { id: 'k2', name: 'Protection Templates', type: 'template', usage: 75, quality: 85 },
    { id: 'k3', name: 'System Tools', type: 'tool', usage: 95, quality: 88 },
    { id: 'k4', name: 'Best Practices', type: 'knowledge', usage: 80, quality: 92 }
  ]);

  // Start in a medium-intensity flow state for collaboration
  useEffect(() => {
    startFlow();
    updateIntensity('medium');
    return () => {
      endFlow();
    };
  }, []);

  // Monitor resource health
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const health = checkHealth();
      if (health.stability < 0.6) {
        onProtectionTrigger?.({
          type: 'system',
          severity: 0.4,
          timestamp: Date.now(),
          context: { space: 'commons', health }
        });
      }
    }, 30000);

    return () => clearInterval(healthCheck);
  }, [checkHealth, onProtectionTrigger]);

  // Toggle resource activation
  const toggleResource = (resourceId: string) => {
    setActiveResources(prev => 
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  return (
    <div className="commons-space">
      <div className="resource-zone">
        <div className="resource-header">
          <h2>Shared Resources</h2>
          <div className="flow-indicator">
            Flow: {flowState.active ? flowState.intensity : 'Inactive'}
          </div>
        </div>

        <div className="resource-grid">
          {resources.map(resource => (
            <div 
              key={resource.id}
              className={`resource-card ${activeResources.includes(resource.id) ? 'active' : ''}`}
              onClick={() => toggleResource(resource.id)}
            >
              <div className="resource-header">
                <h3>{resource.name}</h3>
                <div className="type-badge">{resource.type}</div>
              </div>
              <div className="resource-metrics">
                <div className="metric">
                  <label>Usage</label>
                  <div className="metric-track">
                    <div 
                      className="metric-fill"
                      style={{ width: `${resource.usage}%` }}
                    />
                  </div>
                </div>
                <div className="metric">
                  <label>Quality</label>
                  <div className="metric-track">
                    <div 
                      className="metric-fill"
                      style={{ width: `${resource.quality}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="system-status">
          <div className="status-card">
            <div className="card-header">
              <h3>System Health</h3>
            </div>
            <div className="health-grid">
              <div className="health-item">
                <div className="health-label">Stability</div>
                <div className="health-value">
                  {Math.round((defaultProtection.metrics?.stability ?? 0) * 100)}%
                </div>
              </div>
              <div className="health-item">
                <div className="health-label">Integrity</div>
                <div className="health-value">
                  {Math.round((defaultProtection.metrics?.integrity ?? 0) * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div className="status-card">
            <div className="card-header">
              <h3>Active Resources</h3>
            </div>
            <div className="resource-stats">
              <div className="stat-item">
                <div className="stat-value">{activeResources.length}</div>
                <div className="stat-label">In Use</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{resources.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 