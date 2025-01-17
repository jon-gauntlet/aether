/**
 * @typedef {Object} Field
 * @property {string} id - Unique identifier
 * @property {string} name - Field name
 * @property {number} value - Field value
 */

/**
 * @typedef {Object} Wave
 * @property {string} id - Unique identifier
 * @property {string} type - Wave type
 * @property {number} amplitude - Wave amplitude
 */

/**
 * @typedef {Object} Connection
 * @property {string} id - Unique identifier
 * @property {string} source - Source ID
 * @property {string} target - Target ID
 */

/**
 * @typedef {Object} Space
 * @property {string} id - Unique identifier
 * @property {string} name - Space name
 * @property {Field[]} fields - Array of fields
 * @property {Wave[]} waves - Array of waves
 * @property {Connection[]} connections - Array of connections
 */

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

export const createSpace = (id, name) => ({
  id,
  name,
  fields: [],
  waves: [],
  connections: []
});