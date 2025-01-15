# Testing Infrastructure

## Overview

The Aether project implements a comprehensive testing strategy across multiple layers:

### Test Categories

1. **JavaScript/React Tests**
   - Framework: Vitest
   - Location: `src/**/__tests__/*.{test,spec}.{js,jsx}`
   - Coverage: Components, hooks, utilities
   - Key Features:
     - Parallel execution
     - React Testing Library integration
     - Component isolation
     - State management validation

2. **Python/RAG Tests**
   - Framework: pytest
   - Location: `tests/rag_aether/` and `src/rag_aether/ai/testing/`
   - Coverage: RAG system, AI components, core utilities
   - Key Features:
     - Property-based testing with Hypothesis
     - Parallel test execution
     - Comprehensive system validation

3. **End-to-End Tests**
   - Framework: Playwright
   - Location: `e2e/`
   - Coverage: Full system integration
   - Features:
     - Cross-browser testing
     - User flow validation
     - API integration verification

### Integrated Test Runner

The project includes an optimized test runner (`scripts/run-tests.sh`) that:

1. **Environment Setup**
   - Configures test environment variables
   - Starts required Docker services
   - Ensures service health checks pass

2. **Parallel Execution**
   - Runs JavaScript and Python tests concurrently
   - Utilizes available CPU cores efficiently
   - Manages test isolation

3. **Test Flow**
   ```mermaid
   graph TD
     A[Start Services] --> B[Health Check]
     B --> C[Run JS Tests]
     B --> D[Run Python Tests]
     C --> E{All Passed?}
     D --> E
     E -->|Yes| F[Run E2E Tests]
     E -->|No| G[Report Failures]
     F --> H[Cleanup]
     G --> H
   ```

4. **Results Reporting**
   - Clear status indicators for each test suite
   - Detailed failure reporting
   - Test duration metrics

## Running Tests

### Full Suite
```bash
./scripts/run-tests.sh
```

### CI Mode
```bash
./scripts/run-tests.sh --ci
```

### Individual Suites

JavaScript/React:
```bash
npm test
```

Python/RAG:
```bash
pytest tests/rag_aether/
```

E2E:
```bash
npm run test:e2e
```

## Test Infrastructure

### Docker Services
- Redis for caching
- Elasticsearch for search
- MinIO for object storage
- LocalStack for AWS service simulation

### Health Monitoring
- Service readiness checks
- Test environment validation
- Resource cleanup

## Best Practices

1. **Test Organization**
   - Co-locate tests with implementation
   - Use descriptive test names
   - Group related tests in describe blocks

2. **Test Coverage**
   - Unit tests for core logic
   - Integration tests for subsystems
   - E2E tests for critical paths

3. **Test Data**
   - Use fixtures for common data
   - Implement proper cleanup
   - Avoid test interdependence

4. **Performance**
   - Optimize slow tests
   - Use appropriate timeouts
   - Clean up resources properly

## Debugging Tests

1. **Common Issues**
   - Service availability
   - Resource cleanup
   - Test isolation

2. **Debugging Tools**
   - Test runner verbose mode
   - Docker service logs
   - Test-specific debugging flags

## Continuous Integration

The test infrastructure is integrated with CI/CD:

1. **GitHub Actions**
   - Automated test runs
   - Coverage reporting
   - Performance tracking

2. **Quality Gates**
   - Coverage thresholds
   - Performance benchmarks
   - Code quality metrics 