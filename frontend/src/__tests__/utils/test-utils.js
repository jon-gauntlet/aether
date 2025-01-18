import { render } from '@testing-library/react';
import { TestWrapper } from '../setup';

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// Helper to wait for loading states
export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Helper to simulate API responses
export function mockApiResponse(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

// Helper to simulate API errors
export function mockApiError(status = 500, message = 'Internal Server Error') {
  return Promise.reject({
    status,
    message,
  });
}

// Helper to create test messages
export function createTestMessage({ id, content, role = 'user', timestamp = new Date().toISOString() } = {}) {
  return {
    id: id || Math.random().toString(36).substr(2, 9),
    content,
    role,
    timestamp,
  };
}

// Helper to create test users
export function createTestUser({ id, name, email } = {}) {
  return {
    id: id || Math.random().toString(36).substr(2, 9),
    name: name || 'Test User',
    email: email || 'test@example.com',
  };
} 