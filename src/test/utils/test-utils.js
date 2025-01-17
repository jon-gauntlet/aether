import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Test providers wrapper
const TestProviders = ({ children }) => {
  return (
    <React.StrictMode>
      <React.Suspense fallback={<div>Loading...</div>}>
        {children}
      </React.Suspense>
    </React.StrictMode>
  );
};

const customRender = (ui, options = {}) => {
  const user = userEvent.setup();
  
  return {
    user,
    ...render(ui, {
      wrapper: TestProviders,
      ...options,
    }),
  };
};

// Mock Firebase for tests
vi.mock('@/core/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  firestore: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
    })),
  },
  storage: {
    ref: vi.fn(() => ({
      put: vi.fn(),
      getDownloadURL: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Common test utilities
const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const createMatchMedia = (width) => {
  return (query) => ({
    matches: width >= 768,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
};

// re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// export custom utilities
export {
  customRender as render,
  waitForLoadingToFinish,
  createMatchMedia,
  TestProviders,
}; 