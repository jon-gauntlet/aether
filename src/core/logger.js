import chalk from 'chalk';

/**
 * @readonly
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * @typedef {Object} Logger
 * @property {function(LogLevel): void} setLevel - Set the logging level
 * @property {function(LogLevel, string): void} log - Log a message at a specific level
 * @property {function(string): void} debug - Log a debug message
 * @property {function(string): void} info - Log an info message
 * @property {function(string): void} warn - Log a warning message
 * @property {function(string): void} error - Log an error message
 */

/**
 * @implements {Logger}
 */
class LoggerImpl {
  /** @type {LogLevel} */
  static level = LogLevel.INFO;

  /**
   * Set the logging level
   * @param {LogLevel} level - The logging level to set
   */
  setLevel(level) {
    LoggerImpl.level = level;
  }

  /**
   * Log a message at a specific level
   * @param {LogLevel} level - The logging level
   * @param {string} message - The message to log
   */
  log(level, message) {
    if (level >= LoggerImpl.level) {
      const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
      console.log(`[${levelName}] ${message}`);
    }
  }

  /**
   * Log a debug message
   * @param {string} message - The message to log
   */
  debug(message) {
    this.log(LogLevel.DEBUG, message);
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   */
  info(message) {
    this.log(LogLevel.INFO, message);
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   */
  warn(message) {
    this.log(LogLevel.WARN, message);
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   */
  error(message) {
    this.log(LogLevel.ERROR, message);
  }
}

export { LogLevel, LoggerImpl };