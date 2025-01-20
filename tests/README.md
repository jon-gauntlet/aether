# Testing Guide

This directory contains all tests for the Aether project, organized by type and component.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── frontend/          # Frontend E2E tests using Vitest
│   │   └── chat.test.jsx  # Chat system E2E test
│   └── backend/           # Backend E2E tests
├── integration/           # Integration tests
│   ├── frontend/         # Frontend integration tests
│   └── backend/          # Backend integration tests
└── unit/                 # Unit tests
    ├── frontend/         # Frontend unit tests
    │   ├── auth.test.jsx
    │   └── file-handling.test.jsx
    └── backend/          # Backend unit tests
        ├── test_vector_search.py
        └── test_vector_store.py

## Running Tests

### Frontend Tests (Vitest)

```bash
# Run all frontend tests
npm test

# Run frontend tests in watch mode
npm run test:watch

# Run specific test file
npm test tests/e2e/frontend/chat.test.jsx

# Run with coverage
npm run test:coverage
```

### Backend Tests (Pytest)

```bash
# Run all backend tests
pytest

# Run specific test directory
pytest tests/unit/backend

# Run with coverage
pytest --cov=src tests/
```

## Test Types

### End-to-End Tests
Located in `tests/e2e/`, these tests verify complete user workflows:
- Frontend E2E tests use Vitest and Testing Library
- Focus on user interactions and full system behavior
- Example: `chat.test.jsx` tests the complete chat interaction flow

### Integration Tests
Located in `tests/integration/`, these test interactions between components:
- API integrations
- Database operations
- Service interactions

### Unit Tests
Located in `tests/unit/`, these test individual components:
- Frontend component tests
- Backend function and class tests
- Utility function tests

## Writing Tests

### Frontend Tests
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Backend Tests
```python
import pytest

def test_function():
    result = function_to_test()
    assert result == expected_value
```

## Test Data
- Test fixtures are in `tests/fixtures/`
- Mock data is in `tests/data/`
- Use `setup.js` for frontend test setup
- Use `conftest.py` for backend test setup 