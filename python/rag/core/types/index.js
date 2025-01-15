/**
 * @typedef {import('./base').Field} Field
 * @typedef {import('./base').Resonance} Resonance
 * @typedef {import('./base').Protection} Protection
 * @typedef {import('./base').FlowMetrics} FlowMetrics
 * @typedef {import('./base').BaseMetrics} BaseMetrics
 */

/**
 * @typedef {import('./energy').EnergyState} EnergyState
 * @typedef {import('./energy').EnergyMetrics} EnergyMetrics
 * @typedef {import('./energy').EnergyFlow} EnergyFlow
 */

/**
 * @typedef {import('./flow').FlowState} FlowState
 * @typedef {import('./flow').FlowTransition} FlowTransition
 * @typedef {import('./flow').FlowPattern} FlowPattern
 */

/**
 * @typedef {import('./autonomic').AutonomicState} AutonomicState
 * @typedef {import('./autonomic').AutonomicSystem} AutonomicSystem
 * @typedef {import('./autonomic').AutonomicMetrics} AutonomicMetrics
 */

/**
 * @typedef {import('./consciousness').ConsciousnessState} ConsciousnessState
 * @typedef {import('./consciousness').ConsciousnessLevel} ConsciousnessLevel
 * @typedef {import('./consciousness').AwarenessMetrics} AwarenessMetrics
 */

/**
 * @typedef {import('./protection').ProtectionState} ProtectionState
 * @typedef {import('./protection').ProtectionMetrics} ProtectionMetrics
 * @typedef {import('./protection').Shield} Shield
 */

export {
  // Re-export all type definitions from their respective modules
  Field,
  Resonance,
  Protection,
  FlowMetrics,
  BaseMetrics,
  EnergyState,
  EnergyMetrics,
  EnergyFlow,
  FlowState,
  FlowTransition,
  FlowPattern,
  AutonomicState,
  AutonomicSystem,
  AutonomicMetrics,
  ConsciousnessState,
  ConsciousnessLevel,
  AwarenessMetrics,
  ProtectionState,
  ProtectionMetrics,
  Shield
} 