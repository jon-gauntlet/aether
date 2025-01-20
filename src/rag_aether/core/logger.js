/**
 * @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel
 */

/**
 * Base logger class that defines the logging interface
 */
class Logger {
  /**
   * Log a message with the specified level
   * @param {LogLevel} level - The log level
   * @param {string} message - The message to log
   */
  log(level, message) {
    throw new Error('Not implemented');
  }

  /**
   * Log a debug message
   * @param {string} message - The message to log
   */
  debug(message) {
    this.log('debug', message);
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   */
  info(message) {
    this.log('info', message);
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   */
  warn(message) {
    this.log('warn', message);
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   */
  error(message) {
    this.log('error', message);
  }
}

/**
 * Console implementation of the Logger
 */
class ConsoleLogger extends Logger {
  /**
   * Log a message with the specified level
   * @param {LogLevel} level - The log level
   * @param {string} message - The message to log
   */
  log(level, message) {
    console[level](message);
  }
}

export { Logger, ConsoleLogger };