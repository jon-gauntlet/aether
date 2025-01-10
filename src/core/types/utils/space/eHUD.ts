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

// 1. Foundational types from order.ts
export type {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  SpaceType,
  ConnectionType,
  ConsciousnessType,
  PatternType,
  EnergyFlowType
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

// 3. Consciousness and Energy Flow types
export type {
  ConsciousnessPattern,
  EnergyFlow,
  FlowPattern,
  AutonomicState,
  SystemPattern,
  EnergyIndex
} from './consciousness';

// Re-export base types
export {
  Wave,
  Field,
  Resonance,
  BaseMetrics,
  Protection,
  BaseState,
  BasePattern,
  PatternIndex,
  isValidMeasure,
  isProtected,
  isCoherent,
  hasPattern
} from './base';

// Re-export flow types
export {
  FlowType,
  PresenceType,
  FlowMetrics,
  FlowContext,
  FlowProtection,
  FlowState,
  Flow,
  FlowTransition,
  FlowEngine
} from './flow';

// Re-export energy types
export {
  EnergyMetrics,
  EnergyProtection,
  EnergyState,
  EnergyTransition,
  EnergyPattern,
  DevelopmentEnergy
} from './energy';

// Re-export context types
export {
  ContextMetrics,
  ContextProtection,
  ContextState,
  ContextTransition,
  ContextPattern,
  DevelopmentContext
} from './context';

// Re-export autonomic types
export type {
  AutonomicState,
  AutonomicDevelopmentProps
} from './autonomic';

// Re-export stream types
export type {
  Stream,
  PresenceType,
  PatternStream,
  EnergyStream
} from './stream';

// Re-export space types
