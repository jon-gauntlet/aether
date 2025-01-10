/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Foundational types (order.ts)
 * 2. Structural types (structure.ts)
 * 3. Workspace types (workspace.ts)
 * 4. Experience types (experience.ts)
 */

// 1. Export foundational types
export * from './order';

// 2. Export structural types
export * from './structure';

// 3. Workspace types
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

// 4. Experience types
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
}

// Type validation
export const validateTypes = {
  isValidFlow,
  isValidEnergyState,
  isValidSpace,
  isFlowType,
  isConnectionType,
  isConsciousnessType,
  isSpaceType
}; 