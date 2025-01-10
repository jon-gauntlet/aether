import React, { useEffect } from 'react';
import { useAutonomicSystem } from '../core/hooks/useAutonomicSystem';
import './InformationFlow.css';

interface Props {
  children: React.ReactNode;
}

export function InformationFlow({ children }: Props) {
  const { state, flow$ } = useAutonomicSystem();

  useEffect(() => {
    const subscription = flow$.subscribe(flow => {
      // Update visualization based on flow state
      document.documentElement.style.setProperty(
        '--resonance-depth',
        `${flow.context.depth * 100}%`
      );
      document.documentElement.style.setProperty(
        '--coherence-level',
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
      className="information-flow"
      data-resonance={state.energy.type}
      data-flow={state.energy.flow}
    >
      <div className="resonance-layer">
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

      <div className="coherence-layer">
        <div className="coherence-indicator" style={{
          '--coherence': `${state.energy.level * 100}%`
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