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

// 1. Foundational types from order.ts
export type {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  SpaceType,
  ConnectionType,
  ConsciousnessType
} from './order';

// 2. Structural types from structure.ts
export type {
  Field as StructureField,
  Wave as StructureWave,
  Connection as StructureConnection,
  NaturalFlow as StructureNaturalFlow,
  EnergyState as StructureEnergyState,
  FlowSpace as StructureFlowSpace,
  MindSpace as StructureMindSpace,
  Resonance as StructureResonance,
  Protection as StructureProtection,
  ConsciousnessState as StructureConsciousnessState
} from './structure';

// 3. Consciousness types from consciousness.ts
export type {
  NaturalFlow,
  EnergyState,
  Connection,
  FlowSpace,
  ConsciousnessState,
  Field,
  Wave,
  Resonance,
  Protection,
  MindSpace,
  ThoughtStream,
  ThoughtEvolution
} from './consciousness';

// Export validation functions
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

// Export type guards
export {
  isProtected,
  isCoherent,
  isFlowing
} from './consciousness';

// Export core types
export type {
  Feel,
  Link,
  Spot,
  Move,
  Work,
  Way,
  Change,
  Story,
  Group,
  Level,
  Count,
  Time
} from './core';

// Export flow types
export type {
  FlowPattern,
  FlowState,
  FlowDepth,
  FlowContext,
  Flow
} from './flow';

// Export space types
export type {
  SpaceState,
  SpaceContext,
  SpaceTransition
} from './space';

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