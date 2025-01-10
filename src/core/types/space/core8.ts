/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Foundational types (order.ts)
 * 2. Structural types (structure.ts)
 * 3. Validation functions (validation.ts)
 * 4. Workspace types
 * 5. Experience types
 */

// 1. Export foundational types
export * from './order';

// 2. Export structural types
export * from './structure';

// 3. Export validation functions
export {
  validateField,
  validateNaturalFlow,
  validateEnergyState,
  validateConnection,
  validateResonance,
  validateProtection,
  validateFlowSpace,
  validateMindSpace,
  validateConsciousnessState
} from './validation';

// Import foundational types we need
import type { Connection } from './structure';
import type { Energy } from './order';

// 4. Workspace types
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

// 5. Experience types
export interface Member {
  id: string;
  focus: {
    level: number;
    quality: number;
  };
}

export interface Room {
  id: string;
  calm: number;
  focus: number;
  paths: Connection[];
}

export interface Stage {
  level: number;
  quality: number;
}

export interface State {
  focus: Stage;
  flow: Stage;
