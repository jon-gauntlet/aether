// Error types
export const ErrorTypes = {
  NETWORK: 'NetworkError',
  WEBSOCKET: 'WebSocketError',
  CHAT: 'ChatError',
  AUTH: 'AuthError',
  VALIDATION: 'ValidationError',
  UNKNOWN: 'UnknownError'
};

// Error severities
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Formats an error for logging
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about the error
 * @returns {Object} Formatted error object
 */
export const formatError = (error, context = {}) => {
  return {
    type: getErrorType(error),
    severity: getErrorSeverity(error),
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };
};

/**
 * Determines the type of error
 * @param {Error} error - The error object
 * @returns {string} Error type
 */
export const getErrorType = (error) => {
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return ErrorTypes.NETWORK;
  }
  if (error.message.includes('WebSocket')) {
    return ErrorTypes.WEBSOCKET;
  }
  if (error.message.includes('chat') || error.message.includes('message')) {
    return ErrorTypes.CHAT;
  }
  if (error.message.includes('auth') || error.message.includes('unauthorized')) {
    return ErrorTypes.AUTH;
  }
  if (error.name === 'ValidationError' || error.message.includes('invalid')) {
    return ErrorTypes.VALIDATION;
  }
  return ErrorTypes.UNKNOWN;
};

/**
 * Determines the severity of an error
 * @param {Error} error - The error object
 * @returns {string} Error severity
 */
export const getErrorSeverity = (error) => {
  const type = getErrorType(error);
  
  switch (type) {
    case ErrorTypes.NETWORK:
    case ErrorTypes.WEBSOCKET:
      return ErrorSeverity.HIGH;
    case ErrorTypes.AUTH:
      return ErrorSeverity.CRITICAL;
    case ErrorTypes.CHAT:
      return ErrorSeverity.MEDIUM;
    case ErrorTypes.VALIDATION:
      return ErrorSeverity.LOW;
    default:
      return ErrorSeverity.MEDIUM;
  }
};

/**
 * Checks if an error is recoverable
 * @param {Error} error - The error object
 * @returns {boolean} Whether the error is recoverable
 */
export const isRecoverableError = (error) => {
  const type = getErrorType(error);
  const severity = getErrorSeverity(error);
  
  // Critical errors are not recoverable
  if (severity === ErrorSeverity.CRITICAL) {
    return false;
  }
  
  // Network and WebSocket errors are recoverable
  if (type === ErrorTypes.NETWORK || type === ErrorTypes.WEBSOCKET) {
    return true;
  }
  
  // Chat and validation errors are recoverable
  if (type === ErrorTypes.CHAT || type === ErrorTypes.VALIDATION) {
    return true;
  }
  
  // Unknown errors are not recoverable by default
  return false;
};

/**
 * Gets a user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  const type = getErrorType(error);
  
  switch (type) {
    case ErrorTypes.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection.';
    case ErrorTypes.WEBSOCKET:
      return 'Lost connection to chat. Attempting to reconnect...';
    case ErrorTypes.CHAT:
      return 'Failed to send or receive messages. Please try again.';
    case ErrorTypes.AUTH:
      return 'Your session has expired. Please sign in again.';
    case ErrorTypes.VALIDATION:
      return error.message || 'Please check your input and try again.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

/**
 * Gets recovery instructions for an error
 * @param {Error} error - The error object
 * @returns {string} Recovery instructions
 */
export const getRecoveryInstructions = (error) => {
  const type = getErrorType(error);
  
  switch (type) {
    case ErrorTypes.NETWORK:
      return 'Check your internet connection and try again.';
    case ErrorTypes.WEBSOCKET:
      return 'Wait a moment while we try to reconnect...';
    case ErrorTypes.CHAT:
      return 'Click "Try Again" to resend your message.';
    case ErrorTypes.AUTH:
      return 'Click "Sign In" to refresh your session.';
    case ErrorTypes.VALIDATION:
      return 'Correct the highlighted fields and try again.';
    default:
      return 'Try refreshing the page or contact support if the problem persists.';
  }
};

/**
 * Logs an error with additional context
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about the error
 */
export const logError = (error, context = {}) => {
  const formattedError = formatError(error, context);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', formattedError);
  }
  
  // Here you could send the error to your error tracking service
  // e.g., Sentry, LogRocket, etc.
}; 