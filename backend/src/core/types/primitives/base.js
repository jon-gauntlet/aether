/**
 * @enum {string}
 */
export const FlowState = {
  FOCUSED: 'FOCUSED',
  HYPERFOCUSED: 'HYPERFOCUSED',
  DISTRACTED: 'DISTRACTED',
  RECOVERY: 'RECOVERY'
}

/**
 * @enum {string}
 */
export const ProtectionLevel = {
  MAXIMUM: 'MAXIMUM',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
}

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string} flowState - Current flow state
 * @property {string} protectionLevel - Current protection level
 */

/**
 * @typedef {*} BaseType
 */

/**
 * @typedef {Object} EnergyMetrics
 * @property {number} level - Current energy level
 * @property {number} drain - Energy drain rate
 * @property {number} recovery - Energy recovery rate
 */

/**
 * @typedef {Object} Pattern
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength
 * @property {number} frequency - Pattern frequency
 */

/**
 * Schema for energy metrics validation
 * @type {Object}
 */
export const EnergyMetricsSchema = {
  type: 'object',
  properties: {
    level: { type: 'number', minimum: 0, maximum: 1 },
    drain: { type: 'number', minimum: 0 },
    recovery: { type: 'number', minimum: 0 }
  },
  required: ['level']
}

/**
 * Schema for pattern validation
 * @type {Object}
 */
export const PatternSchema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    strength: { type: 'number', minimum: 0, maximum: 1 },
    frequency: { type: 'number', minimum: 0 }
  },
  required: ['type']
} 