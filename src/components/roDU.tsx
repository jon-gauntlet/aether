import React, { useCallback } from 'react';
import { PatternGuided } from './PatternGuided';
import { EnergyAware } from './EnergyAware';
import { EnergyType } from '../core/energy/types';
import './AutonomicDevelopment.css';

interface AutonomicDevelopmentProps {
  task: string;
  energyType?: EnergyType;
  children: React.ReactNode;
  onStateChange?: (state: AutonomicState) => void;
}

interface AutonomicState {
  inFlow: boolean;
  energyLevel: number;
  hasActivePattern: boolean;
  learningCount: number;
}

export const AutonomicDevelopment: React.FC<AutonomicDevelopmentProps> = ({
  task,
  energyType = EnergyType.Mental,
  children,
  onStateChange
}) => {
  // Track autonomic state
  const handleFlowStateChange = useCallback((inFlow: boolean) => {
    if (onStateChange) {
      onStateChange(prevState => ({
        ...prevState,
        inFlow
      }));
    }
  }, [onStateChange]);

  // Handle low energy
  const handleLowEnergy = useCallback(() => {
    console.log('Energy is low, adapting development patterns...');
  }, []);

  // Handle critical energy
  const handleCriticalEnergy = useCallback(() => {
    console.log('Energy is critical, enforcing rest period...');
  }, []);

  return (
    <div className="autonomic-development">
      <EnergyAware
        type={energyType}
        onLowEnergy={handleLowEnergy}
        onCriticalEnergy={handleCriticalEnergy}
        onFlowStateChange={handleFlowStateChange}
      >
        <PatternGuided task={task}>
          <div className="autonomic-content">
            {children}
          </div>
        </PatternGuided>
      </EnergyAware>

      <div className="autonomic-footer">
        <div className="autonomic-tips">
          <h4>Development Tips</h4>
          <ul>
            <li>Take regular breaks to maintain energy</li>
            <li>Record insights when they occur</li>
            <li>Let patterns emerge naturally</li>
            <li>Honor your natural rhythms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 