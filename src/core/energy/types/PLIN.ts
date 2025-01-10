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

// Import foundational types
import type {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  SpaceType,
  ConnectionType,
  ConsciousnessType
} from './order';

// Import consciousness types
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
  Wave,
  ThoughtStream,
  ThoughtEvolution
} from './consciousness';

// Import validation functions
import {
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

// Import type guards
import {
  isProtected,
  isCoherent,
  isFlowing
} from './consciousness';

// Re-export all types
export type {
  // Foundational types
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  SpaceType,
  ConnectionType,
  ConsciousnessType,

  // Consciousness types
  Connection,
  ConsciousnessState,
  EnergyState,
  Field,
  FlowSpace,
  MindSpace,
  NaturalFlow,
  Protection,
  Resonance,
  Wave,
  ThoughtStream,
  ThoughtEvolution
};

// Re-export type guards
export {
  isProtected,
  isCoherent,
  isFlowing
};

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
};

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