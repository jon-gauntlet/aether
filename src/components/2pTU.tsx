import React, { useEffect } from 'react';
import { useAutonomicDevelopment } from '../core/hooks/useAutonomicDevelopment';
import './AutonomicDevelopment.css';

interface Props {
  children: React.ReactNode;
}

export function AutonomicDevelopment({ children }: Props) {
  const { state, flow$ } = useAutonomicDevelopment();

  useEffect(() => {
    const subscription = flow$.subscribe(flow => {
      if (!flow) return;

      // Update UI based on flow state
      document.documentElement.style.setProperty(
        '--flow-depth',
        `${flow.context.depth * 100}%`
      );
      document.documentElement.style.setProperty(
        '--energy-level',
        `${flow.energy.level * 100}%`
      );
      document.documentElement.style.setProperty(
        '--protection-strength',
        `${flow.protection.depth * 100}%`
      );
    });

    return () => subscription.unsubscribe();
  }, [flow$]);

  return (
    <div 
      className="autonomic-development"
      data-energy={state.energy.type}
      data-flow={state.energy.flow}
    >
      <div className="context-layer">
        <div className="depth-indicator" style={{
          '--depth': `${state.context.depth * 100}%`
        } as React.CSSProperties}>
          <div className="patterns">
            {state.context.patterns.map(pattern => (
              <div key={pattern} className="pattern">{pattern}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="energy-layer">
        <div className="energy-indicator" style={{
          '--energy': `${state.energy.level * 100}%`
        } as React.CSSProperties}>
          <div className="type">{state.energy.type}</div>
          <div className="flow">{state.energy.flow}</div>
        </div>
      </div>

      <div className="protection-layer">
        <div className="protection-indicator" style={{
          '--protection': `${state.protection.depth * 100}%`
        } as React.CSSProperties}>
          <div className="patterns">
            {state.protection.patterns.map(pattern => (
              <div key={pattern} className="protected-pattern">{pattern}</div>
            ))}
          </div>
          <div className="states">
            {state.protection.states.map(state => (
              <div key={state} className="protected-state">{state}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="content-layer">
        {children}
      </div>
    </div>
  );
} 