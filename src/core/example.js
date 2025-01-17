/**
 * @typedef {Object} SystemConfig
 * @property {string} name - System name
 * @property {number} priority - Processing priority
 * @property {boolean} active - System active state
 */

/**
 * @param {SystemConfig} config
 * @returns {boolean} Success status
 */
function initializeSystem(config) {
    // Runtime type validation
    if (typeof config.name !== 'string') {
        throw new TypeError('config.name must be a string');
    }
    // ... existing code ...
} 