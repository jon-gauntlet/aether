/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Foundational types (order.ts)
 * 2. Structural types (structure.ts)
 * 3. Consciousness types (consciousness.ts)
 */

// Import all types we need to re-export
import type {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType as FlowTypeBase,
  SpaceType as SpaceTypeBase,
  ConnectionType,
  ConsciousnessType
} from './order';

import type {
  Connection,
  ConsciousnessState,
  EnergyState,
  Field,
  FlowSpace,
  MindSpace,
  NaturalFlow,
  Protection,
  Resonance,
  Wave
} from './consciousness';

import type {
  Field as StructureField,
  Connection as StructureConnection,
  NaturalFlow as StructureNaturalFlow,
  EnergyState as StructureEnergyState,
  FlowSpace as StructureFlowSpace,
  MindSpace as StructureMindSpace,
  ConsciousnessState as StructureConsciousnessState
} from './structure';

// Re-export foundational types
export type {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowTypeBase as CoreFlowType,
  SpaceTypeBase as CoreSpaceType,
  ConnectionType,
  ConsciousnessType
};

// Re-export consciousness types
export type {
  Connection,
  ConsciousnessState,
  EnergyState,
  Field,
  FlowSpace,
  MindSpace,
  NaturalFlow,
  Protection,
  Resonance,
  Wave
};

// Re-export structure types with unique names
export type {
  StructureField,
  StructureConnection,
  StructureNaturalFlow,
  StructureEnergyState,
  StructureFlowSpace,
  StructureMindSpace,
  StructureConsciousnessState
} from './structure';

// Additional types
export interface Space {
  id: string;
  name: string;
  purpose: string;
  character: {
    energy: number;
    focus: number;
    mood: Mood;
  };
  connections: Connection[];
}

export type Mood = 'focused' | 'lively' | 'casual' | 'quiet';

export interface Member {
  id: string;
  focus: {
    level: number;
    quality: number;
  };
  energy: number;
  depth: number;
}

export interface Room {
  id: string;
  calm: number;
  focus: number;
  energy: number;
  paths: Connection[];
}

export interface Stage {
  level: number;
  quality: number;
  energy: number;
}

export interface State {
  focus: Stage;
  flow: Stage;
  depth: number;
}

// Re-export validation functions
export {
  validateField,
  validateNaturalFlow,
  validateEnergyState,
  validateConnection,
  validateResonance,
  validateProtection,
  validateFlowSpace,
  validateMindSpace,
  validateConsciousnessState,
  validateSpace,
  validateMember,
  validateRoom,
  validateStage,
  validateState
} from './validation'; 