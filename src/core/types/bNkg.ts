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

// Core validation utilities
const validateNumber = (value: unknown): value is number => {
  if (typeof value !== 'number') return false;
  return !isNaN(value) && isFinite(value);
};

const validateId = (id: unknown): id is string => {
  if (typeof id !== 'string') return false;
  return id.trim().length > 0;
};

const validateObject = (obj: unknown): obj is object => {
  if (!obj) return false;
  return typeof obj === 'object' && !Array.isArray(obj);
};

const validateArray = <T>(
  arr: unknown, 
  validator: (item: unknown) => boolean,
  required = true
): boolean => {
  if (!Array.isArray(arr)) return !required;
  return arr.every(validator);
};

// System component validation
export const validateField = (field: Field): boolean => {
  if (!validateObject(field)) return false;
  const { center, radius, strength } = field;
  
  if (!validateObject(center)) return false;
  if (!validateNumber(center.x)) return false;
  if (!validateNumber(center.y)) return false;
  if (!validateNumber(center.z)) return false;
  if (!validateNumber(radius) || radius < 0) return false;
  
  return isValidMeasure(strength);
};

export const validateNaturalFlow = (flow: NaturalFlow): boolean => {
  if (!validateObject(flow)) return false;
  
  if (!isValidMeasure(flow.presence)) return false;
  if (!isValidMeasure(flow.harmony)) return false;
  if (!isValidMeasure(flow.rhythm)) return false;
  if (!isValidMeasure(flow.resonance)) return false;
  if (!isValidMeasure(flow.coherence)) return false;
  
  return true;
};

export const validateEnergyState = (state: EnergyState): boolean => {
  if (!validateObject(state)) return false;
  
  if (!isValidMeasure(state.level)) return false;
  if (!isValidMeasure(state.quality)) return false;
  if (!isValidMeasure(state.stability)) return false;
  if (!isValidMeasure(state.protection)) return false;
  
  return true;
};

export const validateConnection = (connection: Connection): boolean => {
  if (!validateObject(connection)) return false;
  
  if (!validateId(connection.from)) return false;
  if (!validateId(connection.to)) return false;
  if (!isConnectionType(connection.type)) return false;
  if (!isValidMeasure(connection.strength)) return false;
  
  return true;
};

export const validateResonance = (resonance: Resonance): boolean => {
  if (!validateObject(resonance)) return false;
  
  if (!validateNumber(resonance.frequency)) return false;
  if (!validateNumber(resonance.amplitude)) return false;
  if (!isValidMeasure(resonance.harmony)) return false;
  if (!validateField(resonance.field)) return false;
  if (!isValidMeasure(resonance.divine)) return false;
  
  return true;
};

export const validateProtection = (protection: Protection): boolean => {
  if (!validateObject(protection)) return false;
  
  if (!isValidMeasure(protection.level)) return false;
  if (!isValidMeasure(protection.strength)) return false;
  if (!validateField(protection.field)) return false;
  
  return true;
};

export const validateFlowSpace = (space: FlowSpace): boolean => {
  if (!validateObject(space)) return false;
  
  if (!validateId(space.id)) return false;
  if (!isFlowType(space.type)) return false;
  if (!validateNaturalFlow(space.flow)) return false;
  if (!isValidMeasure(space.depth)) return false;
  if (!validateArray(space.connections, item => validateConnection(item as Connection))) return false;
  
  return true;
};

export const validateMindSpace = (space: MindSpace): boolean => {
  if (!validateObject(space)) return false;
  
  if (!validateId(space.id)) return false;
  if (!isSpaceType(space.type)) return false;
  if (!validateResonance(space.resonance)) return false;
  if (!isValidMeasure(space.depth)) return false;
  if (!validateArray(space.connections, item => validateConnection(item as Connection))) return false;
  
  return true;
};

export const validateConsciousnessState = (state: ConsciousnessState): boolean => {
  if (!validateObject(state)) return false;
  
  if (!validateId(state.id)) return false;
  if (!isConsciousnessType(state.type)) return false;
  if (!validateNaturalFlow(state.flow)) return false;
  if (!validateEnergyState(state.energy)) return false;
  if (!isValidMeasure(state.depth)) return false;
  if (!validateArray(state.spaces, item => validateFlowSpace(item as FlowSpace))) return false;
  if (!validateArray(state.connections, item => validateConnection(item as Connection))) return false;
  
  return true;
};

// Experience validation
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
    validateArray(space.connections, (item: unknown) => validateConnection(item as Connection))
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
  if (!room || typeof room !== 'object') return false;
  return (
    validateId(room.id) &&
    isValidMeasure(room.calm) &&
    isValidMeasure(room.focus) &&
    isValidMeasure(room.energy) &&
    validateArray(room.paths, (item: unknown) => validateConnection(item as Connection))
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