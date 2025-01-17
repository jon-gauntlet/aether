/**
 * Runtime type validation utilities
 */

/**
 * Validate that a value matches the BaseMetrics type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches BaseMetrics type
 */
export function isBaseMetrics(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.stability === 'number' &&
    typeof value.coherence === 'number' &&
    typeof value.resonance === 'number' &&
    typeof value.quality === 'number'
  );
}

/**
 * Validate that a value matches the FlowMetrics type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches FlowMetrics type
 */
export function isFlowMetrics(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.intensity === 'number' &&
    typeof value.stability === 'number' &&
    typeof value.conductivity === 'number' &&
    typeof value.velocity === 'number' &&
    typeof value.focus === 'number' &&
    typeof value.energy === 'number'
  );
}

/**
 * Validate that a value matches the FlowStats type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches FlowStats type
 */
export function isFlowStats(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.focus === 'number' &&
    typeof value.depth === 'number' &&
    typeof value.duration === 'number' &&
    typeof value.interruptions === 'number' &&
    typeof value.recoveries === 'number' &&
    typeof value.quality === 'number' &&
    isFlowMetrics(value.metrics)
  );
}

/**
 * Validate that a value matches the EnergyState type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches EnergyState type
 */
export function isEnergyState(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.current === 'number' &&
    typeof value.efficiency === 'number' &&
    ['charging', 'discharging', 'stable'].includes(value.phase)
  );
}

/**
 * Validate that a value matches the Protection type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches Protection type
 */
export function isProtection(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.level === 'number' &&
    ['natural', 'enhanced', 'autonomous', 'standard'].includes(value.type) &&
    typeof value.strength === 'number' &&
    typeof value.resilience === 'number' &&
    typeof value.adaptability === 'number' &&
    typeof value.natural === 'boolean' &&
    isField(value.field)
  );
}

/**
 * Validate that a value matches the Field type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches Field type
 */
export function isField(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.center === 'object' &&
    typeof value.center.x === 'number' &&
    typeof value.center.y === 'number' &&
    typeof value.center.z === 'number' &&
    typeof value.radius === 'number' &&
    typeof value.strength === 'number' &&
    typeof value.coherence === 'number' &&
    typeof value.stability === 'number' &&
    isResonance(value.resonance) &&
    typeof value.protection === 'object' &&
    typeof value.protection.shields === 'number' &&
    typeof value.protection.resilience === 'number' &&
    typeof value.protection.adaptability === 'number' &&
    typeof value.protection.stability === 'number' &&
    typeof value.protection.integrity === 'number' &&
    ['natural', 'enhanced', 'autonomous', 'standard'].includes(value.protection.type) &&
    typeof value.protection.level === 'number' &&
    typeof value.protection.strength === 'number' &&
    typeof value.protection.recovery === 'number' &&
    isFlowMetrics(value.flowMetrics) &&
    isBaseMetrics(value.metrics)
  );
}

/**
 * Validate that a value matches the Resonance type
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value matches Resonance type
 */
export function isResonance(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.primary === 'object' &&
    typeof value.primary.frequency === 'number' &&
    typeof value.primary.amplitude === 'number' &&
    typeof value.primary.phase === 'number' &&
    Array.isArray(value.harmonics) &&
    value.harmonics.every(h => 
      typeof h === 'object' &&
      typeof h.frequency === 'number' &&
      typeof h.amplitude === 'number' &&
      typeof h.phase === 'number'
    ) &&
    typeof value.coherence === 'number' &&
    typeof value.stability === 'number'
  );
}

/**
 * Throws if value doesn't match expected type
 * @param {unknown} value - Value to validate
 * @param {string} type - Type name to validate against
 * @throws {TypeError} If validation fails
 */
export function validateType(value, type) {
  const validators = {
    BaseMetrics: isBaseMetrics,
    FlowMetrics: isFlowMetrics,
    FlowStats: isFlowStats,
    EnergyState: isEnergyState,
    Protection: isProtection,
    Field: isField,
    Resonance: isResonance
  };

  const validator = validators[type];
  if (!validator) {
    throw new Error(`Unknown type: ${type}`);
  }

  if (!validator(value)) {
    throw new TypeError(`Value does not match type ${type}`);
  }
} 