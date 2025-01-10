/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Foundational types (order.ts)
 * 2. Structural types (structure.ts)
 * 3. Flow types
 * 4. Energy types
 * 5. Space types
 * 6. Consciousness types
 * 7. Validation functions
 */

// Import foundational types
import type {
  FlowType,
  SpaceType,
  ConsciousnessType,
  Energy,
  Presence,
  Harmony,
  Depth
} from './order';

import type { Connection } from './structure';

// 1. Export foundational types
export * from './order';

// 2. Export structural types
export * from './structure';

// 3. Flow types
export interface NaturalFlow {
  rhythm: number;
  resonance: number;
  coherence: number;
  presence: number;
  harmony: number;
}

export interface FlowContext {
  type: FlowType;
  intensity: number;
  duration: number;
}

export interface FlowSpace {
  id: string;
  type: SpaceType;
  flow: NaturalFlow;
  connections: Connection[];
}

// 4. Energy types
export interface EnergyState {
  current: Energy;
  capacity: Energy;
  recovery: number;
  stability: number;
}

// 5. Space types
export interface Space {
  id: string;
  name: string;
  purpose: string;
  character: {
    energy: Energy;
    focus: number;
    mood: Mood;
  };
  connections: Connection[];
}

export type Mood = 'focused' | 'lively' | 'casual' | 'quiet';

// 6. Consciousness types
export interface ConsciousnessState {
  type: ConsciousnessType;
  presence: Presence;
  harmony: Harmony;
  energy: Energy;
  depth: Depth;
}

// 7. Experience types
export interface Member {
  id: string;
  focus: {
    level: Presence;
    quality: Harmony;
  };
  energy: Energy;
  depth: Depth;
}

export interface Room {
  id: string;
  calm: Harmony;
  focus: Presence;
  energy: Energy;
  paths: Connection[];
}

export interface Stage {
  level: Presence;
  quality: Harmony;
  energy: Energy;
}

export interface State {
  focus: Stage;
  flow: Stage;
  depth: Depth;
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
