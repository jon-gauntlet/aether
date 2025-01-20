import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';
import { act } from 'react';

// Extend Vitest's expect with React Testing Library's matchers
expect.extend(matchers);

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock React 18 rendering
const ReactDOM = require('react-dom');
const ReactDOMClient = require('react-dom/client');

// Create a root container for testing
const rootContainer = document.createElement('div');
document.body.appendChild(rootContainer);

let root = null;

// Mock ReactDOM methods
ReactDOM.render = (element, container, callback) => {
  act(() => {
    if (!root) {
      root = ReactDOMClient.createRoot(container || rootContainer);
    }
    root.render(element);
    if (callback) callback();
  });
};

ReactDOM.unmountComponentAtNode = container => {
  act(() => {
    if (root) {
      root.unmount();
      root = null;
    }
  });
  return true;
};

global.ReactDOM = ReactDOM;

// Cleanup after each test
afterEach(() => {
  cleanup();
  if (root) {
    root.unmount();
    root = null;
  }
}); 