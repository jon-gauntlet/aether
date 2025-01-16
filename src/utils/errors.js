/**
 * Base class for application errors.
 * Extends the built-in Error class with additional properties for error handling.
 * 
 * @example
 * ```javascript
 * class MyError extends AppError {
 *   constructor(message) {
 *     super(message, 'MY_ERROR');
 *   }
 * }
 * 
 * throw new MyError('Something went wrong');
 * ```
 */
export class AppError extends Error {
  /**
   * Creates a new AppError instance.
   * 
   * @param {string} message - The error message
   * @param {string} [code='UNKNOWN_ERROR'] - The error code for categorizing errors
   */
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/**
 * Error class for RAG (Retrieval-Augmented Generation) service related issues.
 * Used when operations with the RAG system fail.
 * 
 * @example
 * ```javascript
 * try {
 *   await ragService.query(question);
 * } catch (error) {
 *   throw new RAGError('Query failed', 'QUERY_ERROR');
 * }
 * ```
 */
export class RAGError extends AppError {
  /**
   * Creates a new RAGError instance.
   * 
   * @param {string} message - The error message
   * @param {string} [code='RAG_ERROR'] - The specific RAG error code
   */
  constructor(message, code = 'RAG_ERROR') {
    super(message, code);
  }
}

/**
 * Error class for API related issues.
 * Used for network requests, authentication, and other API operations.
 * 
 * @example
 * ```javascript
 * try {
 *   await api.get('/endpoint');
 * } catch (error) {
 *   throw new APIError('Request failed', 'NETWORK_ERROR', 500);
 * }
 * ```
 */
export class APIError extends AppError {
  /**
   * Creates a new APIError instance.
   * 
   * @param {string} message - The error message
   * @param {string} [code='API_ERROR'] - The API error code
   * @param {number} [status] - The HTTP status code
   */
  constructor(message, code = 'API_ERROR', status) {
    super(message, code);
    this.status = status;
  }
}

/**
 * Error class for validation issues.
 * Used when input validation fails or data is invalid.
 * 
 * @example
 * ```javascript
 * function validateInput(value) {
 *   if (!value) {
 *     throw new ValidationError('Value is required', 'REQUIRED_FIELD', 'input');
 *   }
 * }
 * ```
 */
export class ValidationError extends AppError {
  /**
   * Creates a new ValidationError instance.
   * 
   * @param {string} message - The error message
   * @param {string} [code='VALIDATION_ERROR'] - The validation error code
   * @param {string} [field] - The field that failed validation
   */
  constructor(message, code = 'VALIDATION_ERROR', field) {
    super(message, code);
    this.field = field;
  }
}

/**
 * Formats an error for display to the user.
 * Handles both custom application errors and standard errors.
 * 
 * @param {Error} error - The error to format
 * @returns {string} Formatted error message
 * 
 * @example
 * ```javascript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = formatError(error);
 *   console.error(message); // "ERROR_CODE: Error message"
 * }
 * ```
 */
export function formatError(error) {
  if (error instanceof AppError) {
    return `${error.code}: ${error.message}`;
  }
  return error.message || 'An unknown error occurred';
}

/**
 * Creates an appropriate error instance from an API error response.
 * Maps HTTP status codes to specific error types.
 * 
 * @param {Error} error - The original error
 * @returns {AppError} Appropriate error instance
 * 
 * @example
 * ```javascript
 * try {
 *   await api.post('/endpoint', data);
 * } catch (error) {
 *   const appError = createErrorFromResponse(error);
 *   // Handle specific error types
 *   if (appError instanceof ValidationError) {
 *     // Handle validation error
 *   }
 * }
 * ```
 */
export function createErrorFromResponse(error) {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.detail || error.message;
    
    switch (status) {
      case 400:
        return new ValidationError(message, 'INVALID_REQUEST');
      case 401:
        return new APIError(message, 'UNAUTHORIZED', status);
      case 403:
        return new APIError(message, 'FORBIDDEN', status);
      case 404:
        return new APIError(message, 'NOT_FOUND', status);
      default:
        return new APIError(message, 'API_ERROR', status);
    }
  }
  
  if (error.request) {
    return new APIError('Network error occurred', 'NETWORK_ERROR');
  }
  
  return new AppError(error.message);
} 