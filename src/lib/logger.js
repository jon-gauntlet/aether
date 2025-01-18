const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

// Track error counts for monitoring
const errorStats = {
  counts: {},
  lastError: null,
  startTime: Date.now()
}

const getTimestamp = () => new Date().toISOString()

export const logger = {
  error: (message, error) => {
    const timestamp = getTimestamp()
    console.error(`[${timestamp}] ERROR:`, message)
    
    if (error) {
      console.error(error)
      // Track error
      const errorType = error.name || 'UnknownError'
      errorStats.counts[errorType] = (errorStats.counts[errorType] || 0) + 1
      errorStats.lastError = {
        type: errorType,
        message: error.message,
        timestamp
      }
    }
  },
  
  warn: (message) => {
    console.warn(`[${getTimestamp()}] WARN:`, message)
  },
  
  info: (message) => {
    console.info(`[${getTimestamp()}] INFO:`, message) 
  },
  
  debug: (message) => {
    if (import.meta.env.DEV) {
      console.debug(`[${getTimestamp()}] DEBUG:`, message)
    }
  },

  // Get error statistics
  getErrorStats: () => ({
    ...errorStats,
    uptime: Date.now() - errorStats.startTime
  })
} 