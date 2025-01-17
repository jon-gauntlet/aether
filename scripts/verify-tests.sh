#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting test verification process..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create test setup if it doesn't exist
mkdir -p src/tests/mocks

# Create Supabase mock
cat > src/tests/mocks/supabase.js << EOL
export const mockSupabase = {
  from: (table) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }),
  storage: {
    from: (bucket) => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test.pdf' } }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.pdf' } }),
      remove: vi.fn().mockResolvedValue(true),
    }),
  },
};
EOL

# Create test setup file
cat > src/tests/setup.js << EOL
import '@testing-library/jest-dom';
import { vi } from 'vitest';

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

// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserver,
});

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserver,
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
EOL

# Run tests
echo "Running tests..."
npm run test

# Run coverage
echo "Running test coverage..."
npm run test:coverage

# Check if coverage meets threshold
if grep -q '"lines": [0-9][0-9]' coverage/coverage-summary.json; then
    echo -e "${GREEN}Coverage threshold met${NC}"
else
    echo -e "${RED}Coverage threshold not met${NC}"
    exit 1
fi

echo -e "${GREEN}Test verification complete!${NC}" 