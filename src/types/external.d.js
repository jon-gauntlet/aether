/**
 * @typedef {Object} DatabaseClient
 * @property {() => Promise<void>} $connect - Connect to the database
 * @property {() => Promise<void>} $disconnect - Disconnect from the database
 * @property {(query: string) => Promise<any>} $queryRaw - Execute a raw query
 */

/**
 * @typedef {Object} Space
 * @property {string} id - Space identifier
 * @property {string} name - Space name
 * @property {string} type - Space type
 * @property {Object} characteristics - Space characteristics
 */

/**
 * @typedef {Object} Flow
 * @property {boolean} isActive - Whether flow is active
 * @property {number} intensity - Flow intensity
 * @property {Object} metrics - Flow metrics
 */

/**
 * @typedef {Object} Energy
 * @property {number} level - Energy level
 * @property {string} type - Energy type
 * @property {Object} field - Energy field
 */ 