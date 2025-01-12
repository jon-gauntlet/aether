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

// Re-export domain types
export * from './autonomic';
export * from './consciousness';
export * from './energy';
export * from './flow';
export * from './protection';
export * from './space';

// Re-export utility types
export * from './utils';

// Re-export test types
