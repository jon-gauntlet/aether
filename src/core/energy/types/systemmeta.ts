/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Flow Types (flow.ts)
 * 2. Energy Types (energy.ts)
 * 3. Space Types (space.ts)
 * 4. Consciousness Types (consciousness.ts)
 * 5. Protection Types (protection.ts)
 * 6. Validation Functions (validation.ts)
 */

// Re-export all core types
export * from './flow';
export * from './energy';
export * from './space';
export * from './consciousness';
export * from './protection';
export * from './validation';

// Additional core types that don't fit in other modules
export interface SystemMeta {
  baseFrequency: number;
  baseAmplitude: number;
  baseHarmony: number;
  baseProtection: {
    strength: number;
    resilience: number;
    adaptability: number;
  };
}

export type Depth = 'surface' | 'shallow' | 'deep' | 'profound';

export interface Connection {
  from: string;
  to: string;
  type: 'flow' | 'presence' | 'resonance';
  strength: number;
} 