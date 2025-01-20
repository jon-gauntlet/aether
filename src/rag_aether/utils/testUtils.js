import { validators } from './validation';
import { AppError, ValidationError } from './errors';

/**
 * Validates test data against expected schema
 * 
 * @param {Object} data - Test data to validate
 * @param {Object} schema - Expected schema
 * @throws {ValidationError} If validation fails
 */
export function validateTestData(data, schema) {
  Object.entries(schema).forEach(([key, rules]) => {
    const value = data[key];
    
    // Check required fields
    if (rules.required && value === undefined) {
      throw new ValidationError(
        `Missing required test data: ${key}`,
        'TEST_DATA_ERROR',
        key
      );
    }

    // Type checking
    if (rules.type && value !== undefined) {
      const validator = validators[`is${rules.type}`];
      if (!validator(value)) {
        throw new ValidationError(
          `Invalid type for ${key}: expected ${rules.type}`,
          'TEST_DATA_ERROR',
          key
        );
      }
    }

    // Custom validation
    if (rules.validate && value !== undefined) {
      try {
        const valid = rules.validate(value);
        if (!valid) {
          throw new ValidationError(
            rules.message || `Invalid value for ${key}`,
            'TEST_DATA_ERROR',
            key
          );
        }
      } catch (error) {
        throw new ValidationError(
          `Validation failed for ${key}: ${error.message}`,
          'TEST_DATA_ERROR',
          key
        );
      }
    }
  });
}

/**
 * Creates mock props for component testing
 * 
 * @param {Object} schema - Props schema
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock props
 */
export function createMockProps(schema, overrides = {}) {
  const mockProps = Object.entries(schema).reduce((props, [key, rules]) => {
    if (overrides[key] !== undefined) {
      props[key] = overrides[key];
      return props;
    }

    // Generate default values based on type
    switch (rules.type) {
      case 'String':
        props[key] = `mock_${key}`;
        break;
      case 'Number':
        props[key] = 0;
        break;
      case 'Boolean':
        props[key] = false;
        break;
      case 'Array':
        props[key] = [];
        break;
      case 'Object':
        props[key] = {};
        break;
      case 'Function':
        props[key] = jest.fn();
        break;
      default:
        props[key] = null;
    }
    return props;
  }, {});

  // Validate the generated props
  validateTestData(mockProps, schema);
  return mockProps;
}

/**
 * Creates a mock error for testing error states
 * 
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @returns {AppError} Mock error
 */
export function createMockError(code = 'TEST_ERROR', message = 'Test error') {
  return new AppError(message, code);
}

/**
 * Wraps async tests to handle errors consistently
 * 
 * @param {Function} testFn - Async test function
 * @returns {Function} Wrapped test function
 */
export function withErrorHandling(testFn) {
  return async (...args) => {
    try {
      await testFn(...args);
    } catch (error) {
      // Log additional context in test failures
      console.error('Test failed with error:', {
        error,
        args,
        stack: error.stack
      });
      throw error;
    }
  };
}

/**
 * Creates a mock API response
 * 
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Object} Mock response
 */
export function createMockResponse(data, status = 200) {
  return {
    data,
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: () => Promise.resolve(data)
  };
}

/**
 * Test helper to wait for async operations
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after delay
 */
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock event object
 * 
 * @param {string} type - Event type
 * @param {Object} props - Event properties
 * @returns {Object} Mock event
 */
export function createMockEvent(type = 'click', props = {}) {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...props
  };
}

/**
 * Test helper to mock console methods
 * 
 * @param {Array} methods - Console methods to mock
 * @returns {Function} Cleanup function
 */
export function mockConsole(methods = ['log', 'error', 'warn']) {
  const original = {};
  methods.forEach(method => {
    original[method] = console[method];
    console[method] = jest.fn();
  });

  return () => {
    methods.forEach(method => {
      console[method] = original[method];
    });
  };
} 