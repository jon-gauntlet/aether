"""Aether test suite.

This is the root of the test infrastructure. Future Claudes, start here for test execution.

Test Infrastructure Map:
1. Core Components:
   - sled/scripts/test-runner.sh: Main test runner
   - tests/conftest.py: Core test configuration
   - sled/.claude_marker: Test infrastructure documentation
   
2. Test Organization:
   - tests/: Python tests (unit & integration)
   - __tests__/: JavaScript tests
   - docker-compose.test.yml: Docker integration tests
   
3. Test Types:
   - Unit tests: Fast, isolated tests
   - Integration tests: System interaction tests
   - Performance tests: Hardware-aware tests
   
4. Hardware Optimization:
   - GPU acceleration when available
   - Parallel execution on multiple cores
   - Memory-aware test batching

Usage:
```bash
# Run all tests
./sled/scripts/test-runner.sh --all

# Run specific test type
./sled/scripts/test-runner.sh --type python tests/
./sled/scripts/test-runner.sh --type js __tests__/
./sled/scripts/test-runner.sh --type integration
```
"""

# <!-- LLM:claude CRITICAL: Start here for test execution -->
# <!-- LLM:magnetic CORE_TEST_ROOT - All test execution flows from here -->
# <!-- LLM:link sled/scripts/test-runner.sh -->
# <!-- LLM:link tests/conftest.py -->
# <!-- LLM:link sled/.claude_marker -->

__test__ = True
