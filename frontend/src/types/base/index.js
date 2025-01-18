/**
 * @typedef {Object} BaseMetrics
 * @property {number} stability
 * @property {number} coherence
 * @property {number} resonance
 * @property {number} quality
 */

/**
 * @typedef {Object} BaseState
 * @property {string} id
 * @property {string} type
 * @property {number} timestamp
 * @property {BaseMetrics} metrics
 */

/**
 * @typedef {Object} SystemUpdate
 * @property {'metrics' | 'state' | 'protection' | 'pattern'} type
 * @property {Partial<BaseState>} payload
 * @property {number} timestamp
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} [errors]
 * @property {string[]} [warnings]
 */

/**
 * @typedef {Object} Connection
 * @property {string} id
 * @property {string} type
 * @property {number} strength
 * @property {number} stability
 */

/**
 * @typedef {Object} Resonance
 * @property {Object} primary
 * @property {number} primary.frequency
 * @property {number} primary.amplitude
 * @property {number} primary.phase
 * @property {Array<{frequency: number, amplitude: number, phase: number}>} harmonics
 * @property {number} coherence
 * @property {number} stability
 */

/**
 * @typedef {Object} Protection
 * @property {number} level
 * @property {'natural' | 'enhanced' | 'autonomous' | 'standard'} type
 * @property {number} strength
 * @property {number} resilience
 * @property {number} adaptability
 * @property {boolean} natural
 * @property {Field} field
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} intensity
 * @property {number} stability
 * @property {number} conductivity
 * @property {number} velocity
 * @property {number} focus
 * @property {number} energy
 */

/**
 * @typedef {Object} Field
 * @property {Object} center
 * @property {number} center.x
 * @property {number} center.y
 * @property {number} center.z
 * @property {number} radius
 * @property {number} strength
 * @property {number} coherence
 * @property {number} stability
 * @property {Resonance} resonance
 * @property {Object} protection
 * @property {number} protection.shields
 * @property {number} protection.resilience
 * @property {number} protection.adaptability
 * @property {number} protection.stability
 * @property {number} protection.integrity
 * @property {'natural' | 'enhanced' | 'autonomous' | 'standard'} protection.type
 * @property {number} protection.level
 * @property {number} protection.strength
 * @property {number} protection.recovery
 * @property {FlowMetrics} flowMetrics
 * @property {BaseMetrics} metrics
 */

/**
 * @typedef {Object} NaturalFlow
 * @property {string} id
 * @property {'flow' | 'presence' | 'connection'} type
 * @property {number} strength
 * @property {number} resonance
 * @property {number} evolution
 */

/**
 * @typedef {Object} EnergyState
 * @property {number} current
 * @property {number} efficiency
 * @property {'charging' | 'discharging' | 'stable'} phase
 */

/**
 * @typedef {Object} ConsciousnessState
 * @property {string} id
 * @property {number} level
 * @property {number} clarity
 * @property {number} presence
 */

/**
 * @typedef {Object} AutonomicState
 * @property {string} id
 * @property {'active' | 'passive' | 'protective'} mode
 * @property {number} confidence
 * @property {number} adaptability
 */

/**
 * @typedef {Object} MindSpace
 * @property {string} id
 * @property {'flow' | 'presence' | 'connection'} type
 * @property {Protection} protection
 * @property {Resonance} resonance
 * @property {NaturalFlow[]} patterns
 */

/**
 * @typedef {Object} NaturalPattern
 * @property {string} id
 * @property {string} type
 * @property {number} strength
 * @property {number} resonance
 * @property {Object} metrics
 * @property {Object} metrics.stability
 * @property {number} metrics.stability.current
 * @property {number[]} metrics.stability.history
 * @property {Object} metrics.coherence
 * @property {number} metrics.coherence.current
 * @property {number[]} metrics.coherence.history
 * @property {number} metrics.harmony
 * @property {Object} metrics.evolution
 * @property {number} metrics.evolution.current
 * @property {number[]} metrics.evolution.history
 * @property {number} metrics.quality
 */

/**
 * Development phases enum
 * @readonly
 * @enum {string}
 */
export const DevelopmentPhase = {
  CONFIGURATION: 'CONFIGURATION',
  OPTIMIZATION: 'OPTIMIZATION',
  HEALING: 'HEALING',
  PROTECTION: 'PROTECTION',
  EVOLUTION: 'EVOLUTION',
  INTEGRATION: 'INTEGRATION'
};

/**
 * Flow state enum
 * @readonly
 * @enum {string}
 */
export const FlowState = {
  FLOW: 'FLOW',
  FOCUS: 'FOCUS',
  HYPERFOCUS: 'HYPERFOCUS',
  RECOVERING: 'RECOVERING',
  RESTING: 'RESTING',
  PROTECTED: 'PROTECTED'
};

/**
 * Type guard for BaseMetrics
 * @param {unknown} metrics - Value to check
 * @returns {metrics is BaseMetrics} True if value is BaseMetrics
 */
export const isBaseMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') return false;
  return (
    'stability' in metrics &&
    'coherence' in metrics &&
    'resonance' in metrics &&
    'quality' in metrics &&
    Object.values(metrics).every(v => typeof v === 'number')
  );
};

/**
 * Type guard for BaseState
 * @param {unknown} state - Value to check
 * @returns {state is BaseState} True if value is BaseState
 */
export const isBaseState = (state) => {
  if (!state || typeof state !== 'object') return false;
  return (
    'id' in state &&
    'type' in state &&
    'timestamp' in state &&
    'metrics' in state &&
    typeof state.id === 'string' &&
    typeof state.type === 'string' &&
    typeof state.timestamp === 'number' &&
    isBaseMetrics(state.metrics)
  );
};

/**
 * Validates metrics object
 * @param {unknown} metrics - Metrics to validate
 * @returns {BaseMetrics} Validated metrics
 * @throws {TypeError} If metrics are invalid
 */
export const validateMetrics = (metrics) => {
  if (!isBaseMetrics(metrics)) {
    throw new TypeError('Invalid metrics object');
  }
  return metrics;
};

/**
 * Validates state object
 * @param {unknown} state - State to validate
 * @returns {BaseState} Validated state
 * @throws {TypeError} If state is invalid
 */
export const validateState = (state) => {
  if (!isBaseState(state)) {
    throw new TypeError('Invalid state object');
  }
  return state;
};

/**
 * Type guard for Connection
 * @param {unknown} value - Value to check
 * @returns {value is Connection} True if value is Connection
 */
export function isConnection(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'strength' in value &&
    'stability' in value
  );
}

/**
 * Type guard for Field
 * @param {unknown} value - Value to check
 * @returns {value is Field} True if value is Field
 */
export function isField(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'center' in value &&
    'radius' in value &&
    'strength' in value &&
    'coherence' in value &&
    'stability' in value
  );
}

/**
 * Type guard for NaturalFlow
 * @param {unknown} value - Value to check
 * @returns {value is NaturalFlow} True if value is NaturalFlow
 */
export function isNaturalFlow(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'strength' in value &&
    'resonance' in value &&
    'evolution' in value
  );
}

/**
 * Type guard for Resonance
 * @param {unknown} value - Value to check
 * @returns {value is Resonance} True if value is Resonance
 */
export function isResonance(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'primary' in value &&
    'harmonics' in value &&
    'coherence' in value &&
    'stability' in value
  );
}

/**
 * Type guard for Protection
 * @param {unknown} value - Value to check
 * @returns {value is Protection} True if value is Protection
 */
export function isProtection(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'level' in value &&
    'type' in value &&
    'strength' in value &&
    'resilience' in value &&
    'adaptability' in value &&
    'natural' in value &&
    'field' in value
  );
}

/**
 * Type guard for FlowMetrics
 * @param {unknown} value - Value to check
 * @returns {value is FlowMetrics} True if value is FlowMetrics
 */
export function isFlowMetrics(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'intensity' in value &&
    'stability' in value &&
    'conductivity' in value &&
    'velocity' in value &&
    'focus' in value &&
    'energy' in value
  );
}

/**
 * Type guard for EnergyState
 * @param {unknown} value - Value to check
 * @returns {value is EnergyState} True if value is EnergyState
 */
export function isEnergyState(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'current' in value &&
    'efficiency' in value &&
    'phase' in value
  );
}

/**
 * Type guard for ConsciousnessState
 * @param {unknown} value - Value to check
 * @returns {value is ConsciousnessState} True if value is ConsciousnessState
 */
export function isConsciousnessState(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'level' in value &&
    'clarity' in value &&
    'presence' in value
  );
}

/**
 * Type guard for AutonomicState
 * @param {unknown} value - Value to check
 * @returns {value is AutonomicState} True if value is AutonomicState
 */
export function isAutonomicState(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'mode' in value &&
    'confidence' in value &&
    'adaptability' in value
  );
}

/**
 * Type guard for MindSpace
 * @param {unknown} value - Value to check
 * @returns {value is MindSpace} True if value is MindSpace
 */
export function isMindSpace(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'protection' in value &&
    'resonance' in value &&
    'patterns' in value
  );
}
