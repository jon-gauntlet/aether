# Optimized Testing with Poetry

## Core Principles

1. **Speed First**
   - Fast feedback loop
   - Parallel test execution
   - Smart test selection
   - Minimal dependencies

2. **Test Categories**
   ```python
   @pytest.mark.unit        # < 10ms, no I/O
   @pytest.mark.fast        # < 100ms, minimal I/O
   @pytest.mark.integration # External services
   ```

3. **Development Modes**
   ```bash
   # Quick development testing (< 1s)
   poetry run pytest --quick

   # Focus on specific tests
   poetry run pytest --focus=rag_search
   
   # Watch mode for TDD
   poetry run ptw --now tests/
   
   # Full test suite (pre-commit)
   poetry run pytest -n auto
   ```

## Project Setup

```bash
# Install dependencies
poetry install

# Install pre-commit hooks
poetry run pre-commit install
```

## Test Structure

```python
tests/
├── conftest.py    # Test helpers & fixtures
├── unit/          # Ultra-fast tests
│   ├── test_rag/  # RAG-specific tests
│   └── test_api/  # API tests
├── fast/          # Quick integration tests
└── integration/   # Full service tests
```

## Writing Tests

1. **Speed Optimization**
   ```python
   # Good - Fast fixture from conftest.py
   def test_rag_search(mock_rag_system):
       result = mock_rag_system.search("test")
       assert result.status == "success"
   
   # Good - Fast test with mocked embeddings
   def test_embeddings(mock_embeddings):
       vectors = mock_embeddings("test query")
       assert len(vectors) == 384
   ```

2. **Test Patterns**
   ```python
   @pytest.mark.unit
   def test_feature(mock_rag_system, capture_logs):
       # Arrange - use pre-configured mocks
       query = "test query"
       
       # Act - capture logs for debugging
       with capture_logs as logs:
           result = mock_rag_system.process(query)
       
       # Assert - check both result and logs
       assert result.status == "success"
       assert "Processing query" in logs.text
   ```

3. **Best Practices**
   - Use fixtures from conftest.py
   - Leverage logging for debugging
   - Keep tests focused and fast
   - One assertion per test

## Running Tests

### Development Mode
```bash
# Quick iteration
poetry run pytest --quick

# Focus on specific area
poetry run pytest --focus=embedding

# Watch specific tests
poetry run ptw --now tests/ -k test_rag

# Debug with logs
poetry run pytest -v --log-cli-level=INFO
```

### CI Mode
```bash
# Full suite with coverage
poetry run pytest --cov=rag_aether

# Parallel execution
poetry run pytest -n auto
```

## Debugging Tips

1. **Quick Debug**
   ```bash
   # Run with detailed logs
   poetry run pytest --log-cli-level=DEBUG -v

   # Focus on failing tests
   poetry run pytest --focus=failing_test_name

   # Show local variables on failure
   poetry run pytest --showlocals
   ```

2. **Common Issues**
   - Check logs with `capture_logs` fixture
   - Use `mock_rag_system` for fast tests
   - Enable focus mode for targeted debugging
   - Run with `--quick` during development

3. **Performance Issues**
   - Check test durations in CI output
   - Use session-scoped fixtures
   - Mock expensive operations
   - Run tests in parallel

## Maintenance

1. **Regular Tasks**
   ```bash
   # Update dependencies
   poetry update
   
   # Clean cache
   poetry run pytest --cache-clear
   ```

2. **Performance Monitoring**
   ```bash
   # Show test durations
   poetry run pytest --durations=10
   
   # Profile tests
   poetry run pytest --profile
   ``` 