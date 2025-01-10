import type {
  NaturalFlow,
  EnergyState,
  FlowSpace,
  ConsciousnessState,
  Connection,
  Field,
  Resonance,
  Protection,
  MindSpace
} from './structure';

import {
  isValidMeasure,
  isFlowType,
  isConnectionType,
  isConsciousnessType,
  isSpaceType
} from './order';

export const validateField = (field: Field): boolean => {
  if (!field || typeof field !== 'object') return false;
  const { center, radius, strength } = field;
  return (
    center && typeof center === 'object' &&
    typeof center.x === 'number' &&
    typeof center.y === 'number' &&
    typeof center.z === 'number' &&
    typeof radius === 'number' && radius >= 0 &&
    isValidMeasure(strength)
  );
};

export const validateNaturalFlow = (flow: NaturalFlow): boolean => {
  if (!flow || typeof flow !== 'object') return false;
  return (
    isValidMeasure(flow.presence) &&
    isValidMeasure(flow.harmony) &&
    isValidMeasure(flow.rhythm) &&
    isValidMeasure(flow.resonance) &&
    isValidMeasure(flow.coherence)
  );
};

export const validateEnergyState = (state: EnergyState): boolean => {
  if (!state || typeof state !== 'object') return false;
  return (
    isValidMeasure(state.level) &&
    isValidMeasure(state.quality) &&
    isValidMeasure(state.stability) &&
    isValidMeasure(state.protection)
  );
};

export const validateConnection = (connection: Connection): boolean => {
  if (!connection || typeof connection !== 'object') return false;
  return (
    typeof connection.from === 'string' &&
    typeof connection.to === 'string' &&
    isConnectionType(connection.type) &&
    isValidMeasure(connection.strength)
  );
};

export const validateResonance = (resonance: Resonance): boolean => {
  if (!resonance || typeof resonance !== 'object') return false;
  return (
    typeof resonance.frequency === 'number' &&
    typeof resonance.amplitude === 'number' &&
    isValidMeasure(resonance.harmony) &&
    validateField(resonance.field) &&
    isValidMeasure(resonance.divine)
  );
};

export const validateProtection = (protection: Protection): boolean => {
  if (!protection || typeof protection !== 'object') return false;
  return (
    isValidMeasure(protection.level) &&
    isValidMeasure(protection.strength) &&
    validateField(protection.field)
  );
};

export const validateFlowSpace = (space: FlowSpace): boolean => {
  if (!space || typeof space !== 'object') return false;
  return (
    typeof space.id === 'string' &&
    isFlowType(space.type) &&
    validateNaturalFlow(space.flow) &&
    isValidMeasure(space.depth) &&
    Array.isArray(space.connections) &&
    space.connections.every(validateConnection)
  );
};

export const validateMindSpace = (space: MindSpace): boolean => {
  if (!space || typeof space !== 'object') return false;
  return (
    typeof space.id === 'string' &&
    isSpaceType(space.type) &&
    validateResonance(space.resonance) &&
    isValidMeasure(space.depth) &&
    Array.isArray(space.connections) &&
    space.connections.every(validateConnection)
  );
};

export const validateConsciousnessState = (state: ConsciousnessState): boolean => {
  if (!state || typeof state !== 'object') return false;
  return (
    typeof state.id === 'string' &&
    isConsciousnessType(state.type) &&
    validateNaturalFlow(state.flow) &&
    validateEnergyState(state.energy) &&
    isValidMeasure(state.depth) &&
    Array.isArray(state.spaces) &&
    state.spaces.every(validateFlowSpace) &&
    Array.isArray(state.connections) &&
    state.connections.every(validateConnection)
  );
}; 