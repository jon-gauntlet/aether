import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function that includes common providers and utilities
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} [options] - Additional render options
 * @returns {Object} The rendered component with additional utilities
 */
function customRender(ui, options = {}) {
  return {
    ...render(ui, {
      wrapper: ({ children }) => children,
      ...options,
    }),
  };
}

/**
 * Creates a mock response for the RAG service
 * @param {Object} data - The response data
 * @returns {Object} A mock response object
 */
function createMockRAGResponse(data = {}) {
  return {
    answer: 'Mock answer',
    sources: [
      {
        content: 'Mock source content',
        metadata: { type: 'test' },
      },
    ],
    ...data,
  };
}

/**
 * Creates a mock error for testing error scenarios
 * @param {string} code - The error code
 * @param {string} message - The error message
 * @returns {Error} A mock error object
 */
function createMockError(code = 'TEST_ERROR', message = 'Test error') {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Simulates user input in a form field
 * @param {HTMLElement} element - The form element
 * @param {string} value - The value to type
 * @returns {Promise<void>}
 */
async function typeIntoField(element, value) {
  await userEvent.clear(element);
  await userEvent.type(element, value);
}

/**
 * Waits for loading state to complete
 * @param {Function} callback - Callback to execute after loading
 * @returns {Promise<void>}
 */
async function waitForLoadingToComplete(callback) {
  await callback();
  // Add a small delay to ensure state updates are processed
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Creates a mock event object
 * @param {Object} [overrides] - Properties to override in the event object
 * @returns {Object} A mock event object
 */
function createMockEvent(overrides = {}) {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    ...overrides,
  };
}

// Re-export everything from RTL and user-event
export * from '@testing-library/react';
export { userEvent };

// Export custom utilities
export {
  customRender as render,
  createMockRAGResponse,
  createMockError,
  typeIntoField,
  waitForLoadingToComplete,
  createMockEvent,
}; 