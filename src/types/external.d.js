/**
 * @typedef {Object} PrismaClient
 * @property {function(): Promise<void>} $connect
 * @property {function(): Promise<void>} $disconnect
 * @property {function(string): Promise<any>} $queryRaw
 */

/**
 * @typedef {Object} MeiliSearchConfig
 * @property {string} host
 * @property {string} [apiKey]
 */

/**
 * @param {string} host
 * @param {string} [apiKey]
 * @param {MeiliSearchConfig} [options]
 * @returns {any}
 */
export function instantMeiliSearch(host, apiKey, options) {}

/**
 * @typedef {Object.<string, string>} CSSModule
 */

/**
 * @type {CSSModule}
 */
export const cssClasses = {};

/**
 * @type {CSSModule}
 */
export const scssClasses = {}; 