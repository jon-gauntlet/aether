import React, { useState } from 'react';
import { usePatternLibrary } from '../hooks/usePatternLibrary';
import { Pattern, PatternState } from '../types/patterns';
import './PatternVisualization.css';

interface PatternNodeProps {
  pattern: Pattern;
  angle: number;
  radius: number;
  size: number;
  selected: boolean;
  onClick: () => void;
}

const PatternNode: React.FC<PatternNodeProps> = ({
  pattern,
  angle,
  radius,
  size,
  selected,
  onClick,
}) => {
  const x = Math.cos(angle) * radius + radius;
  const y = Math.sin(angle) * radius + radius;

  return (
    <div
      className={`pattern-node ${selected ? 'selected' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
      onClick={onClick}
    >
      <div className="pattern-content">
        <div className="pattern-name">{pattern.name}</div>
        <div className="pattern-metrics">
          <div
            className="pattern-energy"
            style={{ height: `${pattern.energyLevel * 100}%` }}
          />
          <div
            className="pattern-success"
            style={{ height: `${pattern.successRate * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface PatternDetailsProps {
  pattern: Pattern;
}

const PatternDetails: React.FC<PatternDetailsProps> = ({ pattern }) => {
  return (
    <div className="pattern-details">
      <h3>{pattern.name}</h3>
      <p>{pattern.description}</p>
      
      <div className="pattern-stats">
        <div className="stat">
          <label>Energy Level</label>
          <div className="stat-bar" style={{ width: `${pattern.energyLevel * 100}%` }} />
        </div>
        <div className="stat">
          <label>Success Rate</label>
          <div className="stat-bar" style={{ width: `${pattern.successRate * 100}%` }} />
        </div>
      </div>

      <div className="pattern-context">
        <h4>Context</h4>
        <div className="context-tags">
          {pattern.context.map((ctx: string, i: number) => (
            <span key={i} className="context-tag">
              {ctx}
            </span>
          ))}
        </div>
      </div>

      <div className="pattern-states">
        <h4>States</h4>
        <div className="state-tags">
          {pattern.states.map((state: PatternState, i: number) => (
            <span key={i} className="state-tag">
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
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const radius = 200; // Half of orbit width/height
  const nodeSize = 60;
  const angleStep = (2 * Math.PI) / patterns.length;

  return (
    <div className="pattern-visualization">
      <div className="pattern-orbit">
        {patterns.map((pattern: Pattern, i: number) => (
          <PatternNode
            key={pattern.id}
            pattern={pattern}
            angle={i * angleStep}
            radius={radius}
            size={nodeSize}
            selected={selectedPattern?.id === pattern.id}
            onClick={() => setSelectedPattern(pattern)}
          />
        ))}
      </div>
      {selectedPattern && <PatternDetails pattern={selectedPattern} />}
    </div>
  );
}; 