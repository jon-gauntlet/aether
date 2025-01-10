import type {
  NaturalFlow,
  EnergyState,
  FlowSpace,
  ConsciousnessState,
  Connection,
  Field,
  Wave,
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

import { FlowState, EnergyState } from './base';

// Core validation utilities
const validateNumber = (value: unknown): value is number => {
  if (typeof value !== 'number') return false;
  return !isNaN(value) && isFinite(value);
};

const validateId = (id: unknown): id is string => {
  if (typeof id !== 'string') return false;
  return id.trim().length > 0;
};

const validateObject = (obj: unknown): obj is Record<string, unknown> => {
  if (!obj) return false;
  return typeof obj === 'object' && !Array.isArray(obj);
};

const validateArray = <T>(
  arr: unknown,
  validator: (item: unknown) => boolean,
  required = true
): arr is T[] => {
  if (!Array.isArray(arr)) return !required;
  return arr.every(validator);
};

// System component validation
const validateWave = (wave: unknown): wave is Wave => {
  if (!validateObject(wave)) return false;
  return (
    validateNumber(wave.frequency) &&
    validateNumber(wave.amplitude) &&
    validateNumber(wave.phase)
  );
};

export const validateField = (field: unknown): field is Field => {
  if (!validateObject(field)) return false;

  if (!validateObject(field.center)) return false;
  if (!validateNumber(field.center.x)) return false;
  if (!validateNumber(field.center.y)) return false;
  if (!validateNumber(field.center.z)) return false;
  if (!validateNumber(field.radius) || field.radius < 0) return false;
  if (!isValidMeasure(field.strength)) return false;
  if (!validateArray<Wave>(field.waves, validateWave)) return false;

  return true;
};

export const validateNaturalFlow = (flow: unknown): flow is NaturalFlow => {
  if (!validateObject(flow)) return false;

  if (!isValidMeasure(flow.presence)) return false;
  if (!isValidMeasure(flow.harmony)) return false;
  if (!isValidMeasure(flow.rhythm)) return false;
  if (!isValidMeasure(flow.resonance)) return false;
  if (!isValidMeasure(flow.coherence)) return false;

  return true;
};

export const validateEnergyState = (state: unknown): state is EnergyState => {
  if (!validateObject(state)) return false;

  if (!isValidMeasure(state.level)) return false;
  if (!isValidMeasure(state.quality)) return false;
  if (!isValidMeasure(state.stability)) return false;
  if (!isValidMeasure(state.protection)) return false;

  return true;
};

export const validateConnection = (connection: unknown): connection is Connection => {
  if (!validateObject(connection)) return false;

  if (!validateId(connection.from)) return false;
  if (!validateId(connection.to)) return false;
  if (!isConnectionType(connection.type)) return false;
  if (!isValidMeasure(connection.strength)) return false;

  return true;
};

export const validateResonance = (resonance: unknown): resonance is Resonance => {
  if (!validateObject(resonance)) return false;

  if (!validateNumber(resonance.frequency)) return false;
  if (!validateNumber(resonance.amplitude)) return false;
  if (!isValidMeasure(resonance.harmony)) return false;
  if (!isValidMeasure(resonance.essence)) return false;
  if (!validateField(resonance.field)) return false;

  return true;
};

export const validateProtection = (protection: unknown): protection is Protection => {
  if (!validateObject(protection)) return false;

  if (!isValidMeasure(protection.level)) return false;
  if (!isValidMeasure(protection.strength)) return false;
  if (!isValidMeasure(protection.resilience)) return false;
  if (!isValidMeasure(protection.adaptability)) return false;
  if (!validateField(protection.field)) return false;

  return true;
};

export const validateFlowSpace = (space: unknown): space is FlowSpace => {
  if (!validateObject(space)) return false;

  if (!validateId(space.id)) return false;
  if (!isFlowType(space.type)) return false;
  if (!validateNaturalFlow(space.flow)) return false;
  if (!isValidMeasure(space.depth)) return false;
  if (!validateArray<Connection>(space.connections, validateConnection)) return false;

  return true;
};

export const validateMindSpace = (space: unknown): space is MindSpace => {
  if (!validateObject(space)) return false;

  if (!validateId(space.id)) return false;
  if (!validateResonance(space.resonance)) return false;
  if (!isValidMeasure(space.depth)) return false;
  if (!validateArray<Connection>(space.connections, validateConnection)) return false;

  return true;
};

export const validateConsciousnessState = (state: unknown): state is ConsciousnessState => {
  if (!validateObject(state)) return false;

  if (!validateId(state.id)) return false;
  if (!isConsciousnessType(state.type)) return false;
  if (!validateNaturalFlow(state.flow)) return false;
  if (!validateEnergyState(state.energy)) return false;
  if (!isValidMeasure(state.depth)) return false;
  if (!validateArray<FlowSpace>(state.spaces, validateFlowSpace)) return false;
  if (!validateArray<Connection>(state.connections, validateConnection)) return false;

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
};

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
};