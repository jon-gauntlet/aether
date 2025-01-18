const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

export const logger = {
  error: (message, error) => {
    console.error(message, error)
    // Add error reporting service integration here later
  },
  
  warn: (message) => {
    console.warn(message)
  },
  
  info: (message) => {
    console.info(message)
  },
  
  debug: (message) => {
    if (import.meta.env.DEV) {
      console.debug(message)
    }
  }
} 