import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Optimized test providers with memo
const TestProviders = React.memo(({ children }) => (
  <React.StrictMode>
    <React.Suspense fallback={null}>
      {children}
    </React.Suspense>
  </React.StrictMode>
));

// Cached user event setup
const cachedUserEvent = userEvent.setup();

// Optimized render with shared user event instance
const customRender = (ui, options = {}) => ({
  user: cachedUserEvent,
  ...render(ui, {
    wrapper: TestProviders,
    ...options,
  }),
});

// Optimized Firebase mock with shared instances
const mockFirebaseInstances = {
  docInstance: {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  collectionInstance: {
    doc: vi.fn(() => mockFirebaseInstances.docInstance),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  },
  storageInstance: {
    put: vi.fn(),
    getDownloadURL: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('@/core/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(cb => {
      cb(null);
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  firestore: {
    collection: vi.fn(() => mockFirebaseInstances.collectionInstance),
  },
  storage: {
    ref: vi.fn(() => mockFirebaseInstances.storageInstance),
  },
}));

// Optimized utilities
const waitForLoadingToFinish = () => Promise.resolve();

const createMatchMedia = (width) => (query) => ({
  matches: width >= 768,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export optimized utilities
export {
  customRender as render,
  waitForLoadingToFinish,
  createMatchMedia,
  TestProviders,
  mockFirebaseInstances,
}; 