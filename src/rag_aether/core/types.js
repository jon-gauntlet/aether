/**
 * @typedef {Object} Field
 * @property {string} id - Field identifier
 * @property {string} name - Field name
 * @property {number} value - Field value
 */

/**
 * @typedef {Object} Wave
 * @property {string} id - Wave identifier
 * @property {string} type - Wave type
 * @property {number} amplitude - Wave amplitude
 */

/**
 * @typedef {Object} Connection
 * @property {string} id - Connection identifier
 * @property {string} source - Source identifier
 * @property {string} target - Target identifier
 */

/**
 * @typedef {Object} Space
 * @property {string} id - Space identifier
 * @property {string} name - Space name
 * @property {number} capacity - Space capacity
 * @property {boolean} isPrivate - Privacy flag
 */

// Factory functions for creating objects
export const createField = (id, name, value) => ({
  id,
  name,
  value
});

export const createWave = (id, type, amplitude) => ({
  id,
  type,
  amplitude
});

export const createConnection = (id, source, target) => ({
  id,
  source,
  target
});

export const createSpace = (id, name, capacity = 100, isPrivate = false) => ({
  id,
  name,
  capacity,
  isPrivate
});