/**
 * Core Type Order
 *
 * This file establishes the foundational type hierarchy.
 */

/**
 * @typedef {number} Presence A number between 0 and 1
 */

/**
 * @typedef {number} Harmony A number between 0 and 1
 */

/**
 * @typedef {number} Energy A number between 0 and 1
 */

/**
 * @typedef {number} Depth A number between 0 and 1
 */

/**
 * @typedef {'meditation'|'focus'|'flow'} FlowType
 */

/**
 * @typedef {'flow'|'presence'|'resonance'} ConnectionType
 */

/**
 * @typedef {'individual'|'collective'} ConsciousnessType
 */

/**
 * @typedef {'thought'|'feeling'|'intuition'} SpaceType
 */

/**
 * @typedef {'energy'|'flow'|'autonomic'|'consciousness'} PatternType
 */

/**
 * @typedef {'vital'|'purifying'|'peaceful'|'still'|'protective'|'transformative'} EnergyFlowType
 */

/**
 * Validates if a value is a valid measure (number between 0 and 1)
 * @param {*} value The value to validate
 * @returns {boolean} Whether the value is a valid measure
 */
export const isValidMeasure = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= 0 && value <= 1;
};

/**
 * Checks if a value is a valid FlowType
 * @param {*} type The value to check
 * @returns {boolean} Whether the value is a valid FlowType
 */
export const isFlowType = (type) =>
  typeof type === 'string' && ['meditation', 'focus', 'flow'].includes(type);

/**
 * Checks if a value is a valid ConnectionType
 * @param {*} type The value to check
 * @returns {boolean} Whether the value is a valid ConnectionType
 */
export const isConnectionType = (type) =>
  typeof type === 'string' && ['flow', 'presence', 'resonance'].includes(type);

/**
 * Checks if a value is a valid ConsciousnessType
 * @param {*} type The value to check
 * @returns {boolean} Whether the value is a valid ConsciousnessType
 */
export const isConsciousnessType = (type) =>
  typeof type === 'string' && ['individual', 'collective'].includes(type);

/**
 * Checks if a value is a valid SpaceType
 * @param {*} type The value to check
 * @returns {boolean} Whether the value is a valid SpaceType
 */
export const isSpaceType = (type) =>
  typeof type === 'string' && ['thought', 'feeling', 'intuition'].includes(type);

/**
 * Checks if a value is a valid PatternType
 * @param {*} type The value to check
 * @returns {boolean} Whether the value is a valid PatternType
 */
export const isPatternType = (type) =>
  typeof type === 'string' && ['energy', 'flow', 'autonomic', 'consciousness'].includes(type);

/**
 * Checks if a value is a valid EnergyFlowType
 * @param {*} type The value to check
 * @returns {boolean} Whether the value is a valid EnergyFlowType
 */
export const isEnergyFlowType = (type) =>
  typeof type === 'string' && ['vital', 'purifying', 'peaceful', 'still', 'protective', 'transformative'].includes(type);