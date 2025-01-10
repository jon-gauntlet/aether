import type {
  NaturalFlow,
  EnergyState,
  FlowSpace,
  ConsciousnessState,
  Connection
} from './structure';

import {
  isValidMeasure,
  isFlowType,
  isConnectionType,
  isConsciousnessType,
  isSpaceType
} from './order';

/**
 * Type Validation System
 * 
 * These functions ensure type integrity throughout the system.
 * They should be used at key boundaries where data enters the system.
 */

// Flow Validation
export const validateFlow = (flow: NaturalFlow): boolean => {
  if (!flow) return false;
  return (
    isValidMeasure(flow.presence) &&
    isValidMeasure(flow.harmony) &&
    isValidMeasure(flow.rhythm) &&
    isValidMeasure(flow.resonance) &&
    isValidMeasure(flow.coherence)
  );
};

// Energy Validation
export const validateEnergyState = (state: EnergyState): boolean => {
  if (!state) return false;
  return (
    isValidMeasure(state.level) &&
    isValidMeasure(state.quality) &&
    isValidMeasure(state.stability) &&
    isValidMeasure(state.protection)
  );
};

// Space Validation
export const validateSpace = (space: FlowSpace): boolean => {
  if (!space) return false;
  return (
    typeof space.id === 'string' &&
    isFlowType(space.type) &&
    validateFlow(space.flow) &&
    isValidMeasure(space.depth) &&
    Array.isArray(space.connections) &&
    space.connections.every(validateConnection)
  );
};

// Connection Validation
export const validateConnection = (connection: Connection): boolean => {
  if (!connection) return false;
  return (
    typeof connection.from === 'string' &&
    typeof connection.to === 'string' &&
    isConnectionType(connection.type) &&
    isValidMeasure(connection.strength)
  );
};

// State Validation
export const validateConsciousnessState = (state: ConsciousnessState): boolean => {
  if (!state) return false;
  return (
    typeof state.id === 'string' &&
    isConsciousnessType(state.type) &&
    validateFlow(state.flow) &&
    validateEnergyState(state.energy) &&
    isValidMeasure(state.depth) &&
    Array.isArray(state.spaces) &&
    state.spaces.every(validateSpace) &&
    Array.isArray(state.connections) &&
    state.connections.every(validateConnection)
  );
}; 