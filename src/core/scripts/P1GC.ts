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

// Re-export all base types
export type {
  FlowMetrics,
  FlowState,
  NaturalFlow,
  NaturalFlowType,
  Field,
  Wave,
  Resonance,
  Protection,
  Connection,
  FlowSpace,
  EnergyState,
  ConsciousnessState,
  SystemMeta
} from './base';

// Re-export values
export {
  isProtected,
  isCoherent,
  isFlowing
} from './base';

// Re-export stream types
export type {
  Stream,
  PresenceType
} from './stream';

// Re-export space types
export type { SpaceState } from './space';