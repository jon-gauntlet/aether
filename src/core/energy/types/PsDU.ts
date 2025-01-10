/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Foundational types (order.ts)
 * 2. Structural types (structure.ts)
 * 3. Consciousness types (consciousness.ts)
 * 4. Flow types (flow.ts)
 * 5. Space types (space.ts)
 * 6. Validation functions (validation.ts)
 */

import { Connection } from './consciousness';

// Re-export all types
export * from './order';
export * from './consciousness';
export * from './flow';
export * from './space';

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