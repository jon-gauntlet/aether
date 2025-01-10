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
  if (!isValidMeasure(protection.resilience)) return false;
  if (!isValidMeasure(protection.adaptability)) return false;
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
const validateMood = (mood: unknown): mood is Mood => {
  if (typeof mood !== 'string') return false;
  return ['focused', 'lively', 'casual', 'quiet'].includes(mood);
};

const validateCharacter = (character: unknown): boolean => {
  if (!validateObject(character)) return false;
  
  if (!isValidMeasure((character as any).energy)) return false;
  if (!validateNumber((character as any).focus)) return false;
  if (!validateMood((character as any).mood)) return false;
  
  return true;
};

export const validateSpace = (space: Space): boolean => {
  if (!validateObject(space)) return false;
  
  if (!validateId(space.id)) return false;
  if (typeof space.name !== 'string') return false;
  if (typeof space.purpose !== 'string') return false;
  if (!validateCharacter(space.character)) return false;
  if (!validateArray(space.connections, item => validateConnection(item as Connection))) return false;
  
  return true;
};

export const validateMember = (member: Member): boolean => {
  if (!validateObject(member)) return false;
  
  if (!validateId(member.id)) return false;
  if (!validateObject(member.focus)) return false;
  if (!isValidMeasure(member.focus.level)) return false;
  if (!isValidMeasure(member.focus.quality)) return false;
  if (!isValidMeasure(member.energy)) return false;
  if (!isValidMeasure(member.depth)) return false;
  
  return true;
};

export const validateRoom = (room: Room): boolean => {
  if (!validateObject(room)) return false;
  
  if (!validateId(room.id)) return false;
  if (!isValidMeasure(room.calm)) return false;
  if (!isValidMeasure(room.focus)) return false;
  if (!isValidMeasure(room.energy)) return false;
  if (!validateArray(room.paths, item => validateConnection(item as Connection))) return false;
  
  return true;
};

export const validateStage = (stage: Stage): boolean => {
  if (!validateObject(stage)) return false;
  
  if (!isValidMeasure(stage.level)) return false;
  if (!isValidMeasure(stage.quality)) return false;
  if (!isValidMeasure(stage.energy)) return false;
  
  return true;
};

export const validateState = (state: State): boolean => {
  if (!validateObject(state)) return false;
  
  if (!validateStage(state.focus)) return false;
  if (!validateStage(state.flow)) return false;
  if (!isValidMeasure(state.depth)) return false;
  
  return true;
