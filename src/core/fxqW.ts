import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// Runs a cleanup after each test case
afterEach(() => {
  cleanup();
});