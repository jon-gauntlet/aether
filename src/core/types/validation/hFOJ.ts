import type { FlowState, EnergyState } from './base';

export const validateFlow = (flow: FlowState): boolean => {
  return (
    typeof flow.presence === 'number' &&
    typeof flow.harmony === 'number' &&
    typeof flow.rhythm === 'number' &&
    typeof flow.resonance === 'number' &&
    typeof flow.coherence === 'number' &&
    typeof flow.depth === 'number' &&
    typeof flow.energy === 'number' &&
    typeof flow.metrics === 'object' &&
    typeof flow.observeDepth === 'function' &&
    typeof flow.observeEnergy === 'function' &&
    typeof flow.observeFocus === 'function'
  );
};

export const validateEnergy = (energy: EnergyState): boolean => {
  return (
    typeof energy.level === 'number' &&
    typeof energy.capacity === 'number' &&
    typeof energy.quality === 'number' &&
    typeof energy.stability === 'number' &&
    typeof energy.protection === 'number' &&
    typeof energy.flow === 'number' &&
    typeof energy.recovery === 'number' &&
    typeof energy.reserves === 'number' &&
    typeof energy.timestamp === 'number' &&
    typeof energy.resonance === 'object' &&
    typeof energy.field === 'object'
  );
