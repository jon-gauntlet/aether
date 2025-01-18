# Aether Testing Guide

## Test Organization

The test suite is organized into the following directories:

```
tests/
  e2e/          # End-to-end tests using Playwright
  unit/         # Unit tests for components and functions
  integration/  # Integration tests between services
  fixtures/     # Test data and fixtures
  utils/        # Shared test utilities
```

## Test Categories

### Unit Tests
- Frontend: Vitest for Vue components and utilities
- Backend: Pytest for Python functions and classes
- Coverage requirement: 80% minimum

### Integration Tests
- API communication
- Database operations
- External service integration
- Coverage requirement: 70% minimum

### E2E Tests
- Critical user flows
- Cross-browser compatibility
- Coverage requirement: Key user journeys

## Running Tests

### Frontend Tests
```bash
# Run all frontend tests
npm run test:frontend

# Watch mode
npm run test:frontend:watch

# Coverage report
npm run test:frontend:coverage
```

### Backend Tests
```bash
# Run all backend tests
poetry run pytest

# With coverage
poetry run pytest --cov

# Specific test file
poetry run pytest tests/path/to/test_file.py
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific browser
npx playwright test --project=chromium
```

## Writing Tests

### Naming Conventions
- Test files: `test_*.py` (Python), `*.test.js` or `*.spec.js` (JavaScript)
- Test functions: `test_*` (Python), `it('should...')` (JavaScript)
- Test descriptions: Should clearly state the expected behavior

### Best Practices
1. Follow AAA pattern (Arrange, Act, Assert)
2. One assertion per test when possible
3. Use meaningful test descriptions
4. Keep tests independent
5. Use fixtures for common setup
6. Mock external dependencies

### Example Test Structure

```javascript
// Frontend test example
describe('Component', () => {
  it('should render correctly', () => {
    // Arrange
    const props = {...}
    
    // Act
    const wrapper = mount(Component, { props })
    
    // Assert
    expect(wrapper.exists()).toBe(true)
  })
})
```

```python
# Backend test example
def test_endpoint_behavior():
    # Arrange
    test_data = {...}
    
    # Act
    response = client.post("/endpoint", json=test_data)
    
    # Assert
    assert response.status_code == 200
```

## Coverage Requirements

| Category    | Minimum Coverage |
|------------|-----------------|
| Unit       | 80%            |
| Integration| 70%            |
| E2E        | Key Flows      |

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Merges to main branch
- Release tags

### CI Pipeline Steps
1. Install dependencies
2. Run linters
3. Run unit tests
4. Run integration tests
5. Run E2E tests
6. Generate coverage reports

## Troubleshooting

### Common Issues
1. Test database connection failures
   - Check environment variables
   - Verify database is running
   
2. Flaky E2E tests
   - Increase timeouts
   - Add retry logic
   - Check for race conditions

### Debug Tools
- `pytest -vv` for verbose output
- `pytest -s` to see print statements
- Browser DevTools for E2E tests
- Coverage reports for identifying gaps 