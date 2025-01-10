/**
 * Core Type System
 *
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 *
 * 1. Foundational types (order.ts)
 * 2. Structural types (structure.ts)
 * 3. Consciousness types (consciousness.ts)
 * 4. Energy flow patterns (energy.ts)
 * 5. Natural system patterns (patterns.ts)
 */

// Core types that don't depend on anything else
export type {
  Wave,
  Field,
  Resonance,
  BaseMetrics,
  Protection,
  BaseState,
  BasePattern,
  PatternIndex
} from './base';

// Core functions
export {
  isValidMeasure,
  isProtected,
  isCoherent,
  hasPattern
} from './base';

// Flow types - these only depend on base types
export type {
  PresenceType,
  FlowMetrics,
  FlowContext,
  FlowProtection,
  FlowState,
  Flow,
  FlowTransition,
  FlowEngine
} from './flow';

// Flow enums
export { FlowType } from './flow';

// Energy types - these depend on base types
export type {
  EnergyMetrics,
  EnergyProtection,
  EnergyState,
  EnergyTransition,
  EnergyPattern,
  DevelopmentEnergy
} from './energy';

// Context types - these depend on flow and base types
export type {
  ContextMetrics,
  ContextProtection,
  ContextState,
  ContextTransition,
  ContextPattern,
  DevelopmentContext
} from './context';

// Autonomic types - these depend on all other types
// We split these to avoid naming conflicts
export type { AutonomicDevelopmentProps } from './autonomic';
