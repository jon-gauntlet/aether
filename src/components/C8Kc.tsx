import React, { useEffect, useState } from 'react';
import { SystemIntegration, SystemState } from '../core/integration/SystemIntegration';
import { FlowStateIndicator } from './FlowStateIndicator';
import { FlowModeSelector } from './FlowModeSelector';
import { PatternVisualization } from './PatternVisualization';
import { EnergyAware } from './EnergyAware';
import './SystemDashboard.css';

interface SystemMetrics {
  flowQuality: number;
  energyEfficiency: number;
  protectionLevel: number;
  patternCoherence: number;
}

interface Props {
  integration: SystemIntegration;
}

export const SystemDashboard: React.FC<Props> = ({ integration }) => {
  const [state, setState] = useState<SystemState | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    flowQuality: 0,
    energyEfficiency: 0,
    protectionLevel: 0,
    patternCoherence: 0
  });

  useEffect(() => {
    const subscription = integration.observeSystemState().subscribe(newState => {
      setState(newState);
      if (newState) {
        setMetrics(integration.getSystemMetrics());
      }
    });

    return () => subscription.unsubscribe();
  }, [integration]);

  if (!state) return <div>Loading system state...</div>;

  const {
    flow,
    protection,
    hyperfocus,
    energy,
    validation
  } = state;

  return (
    <div className="system-dashboard">
      <div className="dashboard-header">
        <h1>System Dashboard</h1>
        <div className="system-metrics">
          <div className="metric">
            <label>Flow Quality</label>
            <div className="value">{(metrics.flowQuality * 100).toFixed(1)}%</div>
          </div>
          <div className="metric">
            <label>Energy Efficiency</label>
            <div className="value">{(metrics.energyEfficiency * 100).toFixed(1)}%</div>
          </div>
          <div className="metric">
            <label>Protection Level</label>
            <div className="value">{(metrics.protectionLevel * 100).toFixed(1)}%</div>
          </div>
          <div className="metric">
            <label>Pattern Coherence</label>
            <div className="value">{(metrics.patternCoherence * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="flow-section">
          <h2>Flow State</h2>
          <FlowStateIndicator
            intensity={hyperfocus.intensity}
            duration={hyperfocus.duration}
            contextRetention={hyperfocus.contextRetention}
          />
          <FlowModeSelector
            currentMode={flow.mode}
            isProtected={protection.type === 'hard'}
          />
        </div>

        <div className="energy-section">
          <h2>Energy System</h2>
          <EnergyAware
            current={energy.current}
            max={energy.max}
            efficiency={energy.efficiency}
            phase={energy.developmentPhase}
            focusMultiplier={energy.focusMultiplier}
          />
        </div>

        <div className="patterns-section">
          <h2>Pattern Recognition</h2>
          <PatternVisualization
            patterns={validation.patterns}
            errors={validation.errors}
            coherence={metrics.patternCoherence}
          />
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="protection-status">
          Protection: {protection.type.toUpperCase()} ({protection.level * 100}%)
        </div>
        <div className="system-status">
          System Health: {validation.errors.length === 0 ? 'OPTIMAL' : 'NEEDS ATTENTION'}
        </div>
      </div>
    </div>
  );
}; 