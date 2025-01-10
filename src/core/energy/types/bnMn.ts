import type { FlowState } from './flow';
import type { EnergyState } from './base';

export const validateFlow = (flow: FlowState): boolean => {
  if (!flow.metrics) return false;
  
  const metrics = flow.metrics;
  return (
    typeof metrics.presence === 'number' &&
    typeof metrics.harmony === 'number' &&
    typeof metrics.rhythm === 'number' &&
    typeof metrics.resonance === 'number' &&
    typeof metrics.coherence === 'number' &&
    typeof metrics.depth === 'number' &&
    typeof metrics.energy === 'number'
  );
};

export const validateEnergy = (energy: EnergyState): boolean => {
  if (!energy.metrics) return false;

  return (
    typeof energy.level === 'number' &&
    typeof energy.type === 'string' &&
    typeof energy.metrics.intensity === 'number' &&
    typeof energy.metrics.coherence === 'number' &&
    typeof energy.metrics.resonance === 'number' &&
    typeof energy.metrics.presence === 'number' &&
    typeof energy.metrics.harmony === 'number' &&
    typeof energy.metrics.rhythm === 'number'
  );
};