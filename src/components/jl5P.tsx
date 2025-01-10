import React, { useState, useEffect } from 'react';
import { usePatternLibrary } from '../hooks/usePatternLibrary';
import { useAutonomicSystem } from '../core/hooks/useAutonomicSystem';
import { Pattern, PatternState } from '../types/patterns';
import './PatternVisualization.css';

interface PatternNodeProps {
  pattern: Pattern;
  angle: number;
  radius: number;
  size: number;
  selected: boolean;
  resonanceLevel: number;
  coherenceLevel: number;
  onClick: () => void;
}

const PatternNode: React.FC<PatternNodeProps> = ({
  pattern,
  angle,
  radius,
  size,
  selected,
  resonanceLevel,
  coherenceLevel,
  onClick,
}) => {
  const x = Math.cos(angle) * radius + radius;
  const y = Math.sin(angle) * radius + radius;

  const scale = 1 + (resonanceLevel * 0.2);
  const glow = coherenceLevel * 20;

  return (
    <div
      className={`pattern-node ${selected ? 'selected' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        boxShadow: `0 0 ${glow}px rgba(255, 255, 255, ${coherenceLevel * 0.5})`
      }}
      onClick={onClick}
      data-testid={`pattern-node-${pattern.id}`}
    >
      <div className="pattern-content">
        <div className="pattern-name">{pattern.name}</div>
        <div className="pattern-metrics">
          <div
            className="pattern-energy"
            style={{ height: `${pattern.energyLevel * 100}%` }}
            data-testid="energy-bar"
          />
          <div
            className="pattern-success"
            style={{ height: `${pattern.successRate * 100}%` }}
            data-testid="success-bar"
          />
        </div>
      </div>
    </div>
  );
};

interface PatternDetailsProps {
  pattern: Pattern;
  resonanceType: string;
  flowState: string;
}

const PatternDetails: React.FC<PatternDetailsProps> = ({ pattern, resonanceType, flowState }) => {
  return (
    <div className="pattern-details" data-testid="pattern-details">
      <h3>{pattern.name}</h3>
      <p>{pattern.description}</p>
      
      <div className="pattern-stats">
        <div className="stat">
          <label>Energy Level</label>
          <div 
            className="stat-bar" 
            style={{ width: `${pattern.energyLevel * 100}%` }}
            data-testid="energy-level-bar"
          />
        </div>
        <div className="stat">
          <label>Success Rate</label>
          <div 
            className="stat-bar" 
            style={{ width: `${pattern.successRate * 100}%` }}
            data-testid="success-rate-bar"
          />
        </div>
        <div className="stat">
          <label>Resonance Type</label>
          <div className="resonance-type" data-testid="resonance-type">{resonanceType}</div>
        </div>
        <div className="stat">
          <label>Flow State</label>
          <div className="flow-state" data-testid="flow-state">{flowState}</div>
        </div>
      </div>

      <div className="pattern-context">
        <h4>Context</h4>
        <div className="context-tags" data-testid="context-tags">
          {pattern.context.map((ctx: string, i: number) => (
            <span key={i} className="context-tag" data-testid={`context-tag-${i}`}>
              {ctx}
            </span>
          ))}
        </div>
      </div>

      <div className="pattern-states">
        <h4>States</h4>
        <div className="state-tags" data-testid="state-tags">
          {pattern.states.map((state: PatternState, i: number) => (
            <span key={i} className="state-tag" data-testid={`state-tag-${i}`}>
              {state}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PatternVisualization: React.FC = () => {
  const { patterns } = usePatternLibrary();
  const { state, flow$ } = useAutonomicSystem();
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const [coherenceLevel, setCoherenceLevel] = useState(0);

  useEffect(() => {
    const subscription = flow$.subscribe(flow => {
      setResonanceLevel(flow.context.depth);
      setCoherenceLevel(flow.energy.level);
    });

    return () => subscription.unsubscribe();
  }, [flow$]);

  const radius = 200; // Half of orbit width/height
  const nodeSize = 60;
  const angleStep = (2 * Math.PI) / patterns.length;

  return (
    <div 
      className="pattern-visualization"
      data-resonance={state.energy.type}
      data-flow={state.energy.flow}
      data-testid="pattern-visualization"
    >
      <div className="pattern-orbit" data-testid="pattern-orbit">
        {patterns.map((pattern: Pattern, i: number) => (
          <PatternNode
            key={pattern.id}
            pattern={pattern}
            angle={i * angleStep}
            radius={radius}
            size={nodeSize}
            selected={selectedPattern?.id === pattern.id}
            resonanceLevel={resonanceLevel}
            coherenceLevel={coherenceLevel}
            onClick={() => setSelectedPattern(pattern)}
          />
        ))}
      </div>
      {selectedPattern && (
        <PatternDetails 
          pattern={selectedPattern}
          resonanceType={state.energy.type}
          flowState={state.energy.flow}
        />
      )}
    </div>
  );
}; 