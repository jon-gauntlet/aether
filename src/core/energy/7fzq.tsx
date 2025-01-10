import React, { useEffect } from 'react';
import { useEnergy } from '../core/energy/useEnergy';
import { EnergyType } from '../core/energy/types';
import './EnergyAware.css';

interface EnergyAwareProps {
  type?: EnergyType;
  children: React.ReactNode;
  onLowEnergy?: () => void;
  onCriticalEnergy?: () => void;
  onFlowStateChange?: (inFlow: boolean) => void;
}

export const EnergyAware: React.FC<EnergyAwareProps> = ({
  type = EnergyType.Mental,
  children,
  onLowEnergy,
  onCriticalEnergy,
  onFlowStateChange
}) => {
  const {
    energy,
    enterFlow,
    exitFlow,
    rest,
    boost,
    isLow,
    isCritical,
    inFlow
  } = useEnergy(type);

  // Monitor energy levels
  useEffect(() => {
    if (isLow && onLowEnergy) {
      onLowEnergy();
    }
    if (isCritical && onCriticalEnergy) {
      onCriticalEnergy();
    }
  }, [isLow, isCritical, onLowEnergy, onCriticalEnergy]);

  // Monitor flow state
  useEffect(() => {
    if (onFlowStateChange) {
      onFlowStateChange(inFlow);
    }
  }, [inFlow, onFlowStateChange]);

  // Auto-rest when critical
  useEffect(() => {
    if (isCritical) {
      rest(300).catch(console.error); // 5 minute rest
    }
  }, [isCritical, rest]);

  return (
    <div className={`energy-aware ${inFlow ? 'in-flow' : ''}`}>
      <div className="energy-status">
        <div className="energy-bar">
          <div
            className="energy-level"
            style={{ width: `${energy.current}%` }}
          />
        </div>
        <div className="energy-meta">
          <span className="energy-type">{energy.type}</span>
          <span className="energy-value">{Math.round(energy.current)}%</span>
          {inFlow && <span className="flow-indicator">Flow</span>}
        </div>
      </div>

      <div className="energy-controls">
        <button
          onClick={() => enterFlow('User triggered')}
          disabled={inFlow}
          className="flow-btn"
        >
          Enter Flow
        </button>
        <button
          onClick={() => exitFlow('User triggered')}
          disabled={!inFlow}
          className="flow-btn"
        >
          Exit Flow
        </button>
        <button
          onClick={() => rest(60)}
          disabled={inFlow}
          className="rest-btn"
        >
          Quick Rest
        </button>
        <button
          onClick={() => boost(20, 'User boost')}
          disabled={energy.current === energy.max}
          className="boost-btn"
        >
          Energy Boost
        </button>
      </div>

      <div className={`energy-content ${isLow ? 'low-energy' : ''}`}>
        {children}
      </div>

      {isLow && !isCritical && (
        <div className="energy-warning">
          Energy is low. Consider taking a break.
        </div>
      )}

      {isCritical && (
        <div className="energy-critical">
          Critical energy level. Rest is required.
        </div>
      )}
    </div>
  );
}; 