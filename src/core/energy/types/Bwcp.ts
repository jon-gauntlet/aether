import type {
  NaturalFlow,
  EnergyState,
  FlowSpace,
  ConsciousnessState,
  Connection,
  Field,
  Resonance,
  Protection,
  MindSpace,
  Space,
  Member,
  Room,
  Stage,
  State,
  Mood
} from './index';

import {
  isValidMeasure,
  isFlowType,
  isConnectionType,
  isConsciousnessType,
  isSpaceType
} from './order';

// Foundational Validation - Numbers and Measures
const validateNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value) && isFinite(value);

const validateId = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0;

const validateArray = <T>(arr: unknown, validator: (item: unknown) => item is T): arr is T[] =>
  Array.isArray(arr) && arr.every(validator);

// Core System Validation
export const validateField = (field: Field): boolean => {
  if (!field || typeof field !== 'object') return false;
  const { center, radius, strength } = field;
  return (
    center && typeof center === 'object' &&
    validateNumber(center.x) &&
    validateNumber(center.y) &&
    validateNumber(center.z) &&
    validateNumber(radius) && radius >= 0 &&
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
    validateId(connection.from) &&
    validateId(connection.to) &&
    isConnectionType(connection.type) &&
    isValidMeasure(connection.strength)
  );
};

export const validateResonance = (resonance: Resonance): boolean => {
  if (!resonance || typeof resonance !== 'object') return false;
  return (
    validateNumber(resonance.frequency) &&
    validateNumber(resonance.amplitude) &&
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
    validateId(space.id) &&
    isFlowType(space.type) &&
    validateNaturalFlow(space.flow) &&
    isValidMeasure(space.depth) &&
    validateArray(space.connections, validateConnection)
  );
};

export const validateMindSpace = (space: MindSpace): boolean => {
  if (!space || typeof space !== 'object') return false;
  return (
    validateId(space.id) &&
    isSpaceType(space.type) &&
    validateResonance(space.resonance) &&
    isValidMeasure(space.depth) &&
    validateArray(space.connections, validateConnection)
  );
};

export const validateConsciousnessState = (state: ConsciousnessState): boolean => {
  if (!state || typeof state !== 'object') return false;
  return (
    validateId(state.id) &&
    isConsciousnessType(state.type) &&
    validateNaturalFlow(state.flow) &&
    validateEnergyState(state.energy) &&
    isValidMeasure(state.depth) &&
    validateArray(state.spaces, validateFlowSpace) &&
    validateArray(state.connections, validateConnection)
  );
};

// Experience Validation
const validateMood = (mood: unknown): mood is Mood =>
  typeof mood === 'string' && ['focused', 'lively', 'casual', 'quiet'].includes(mood);

export const validateSpace = (space: Space): boolean => {
  if (!space || typeof space !== 'object') return false;
  return (
    validateId(space.id) &&
    typeof space.name === 'string' &&
    typeof space.purpose === 'string' &&
    space.character && typeof space.character === 'object' &&
    isValidMeasure(space.character.energy) &&
    validateNumber(space.character.focus) &&
    validateMood(space.character.mood) &&
    validateArray(space.connections, validateConnection)
  );
};

export const validateMember = (member: Member): boolean => {
  if (!member || typeof member !== 'object') return false;
  return (
    validateId(member.id) &&
    member.focus && typeof member.focus === 'object' &&
    isValidMeasure(member.focus.level) &&
    isValidMeasure(member.focus.quality) &&
    isValidMeasure(member.energy) &&
    isValidMeasure(member.depth)
  );
};

export const validateRoom = (room: Room): boolean => {
  if (!member || typeof room !== 'object') return false;
  return (
    validateId(room.id) &&
    isValidMeasure(room.calm) &&
    isValidMeasure(room.focus) &&
    isValidMeasure(room.energy) &&
    validateArray(room.paths, validateConnection)
  );
};

export const validateStage = (stage: Stage): boolean => {
  if (!stage || typeof stage !== 'object') return false;
  return (
    isValidMeasure(stage.level) &&
    isValidMeasure(stage.quality) &&
    isValidMeasure(stage.energy)
  );
};

export const validateState = (state: State): boolean => {
  if (!state || typeof state !== 'object') return false;
  return (
    validateStage(state.focus) &&
    validateStage(state.flow) &&
    isValidMeasure(state.depth)
  );
}; 