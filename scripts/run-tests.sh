#!/bin/bash

# Fast test runner with parallel execution
# Usage: ./scripts/run-tests.sh [--ci]

set -e

# Configuration
export NODE_ENV=test
export PYTHONPATH=$PYTHONPATH:$(pwd)
CPU_COUNT=$(nproc)
IS_CI=${1:-false}

echo "🚀 Starting optimized test run on $CPU_COUNT cores"

# Start test services in background
echo "📦 Starting test services..."
docker-compose -f docker-compose.test.yml up -d

# Function to wait for services
wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.test.yml ps | grep -q "healthy"; then
            echo "✅ Services ready"
            return 0
        fi
        echo "⏳ Waiting... ($i/30)"
        sleep 1
    done
    echo "❌ Services failed to start"
    exit 1
}

# Run JavaScript tests in parallel
run_js_tests() {
    echo "🧪 Running JavaScript tests..."
    npm run test -- --pool=vmThreads --poolOptions.threads.singleThread=false --poolOptions.threads.minThreads=$CPU_COUNT --poolOptions.threads.maxThreads=$CPU_COUNT --reporter=verbose &
    JS_PID=$!
}

# Run Python tests in parallel
run_python_tests() {
    echo "🐍 Running Python tests..."
    pytest -v tests/ src/rag_aether/ai/testing/ &
    PY_PID=$!
}

# Run E2E tests (these often need to be sequential)
run_e2e_tests() {
    echo "🔄 Running E2E tests..."
    npm run test:e2e &
    E2E_PID=$!
}

# Main execution
wait_for_services

# Start all test suites in parallel
run_js_tests
run_python_tests

# Wait for background processes
echo "⏳ Waiting for tests to complete..."
wait $JS_PID
JS_STATUS=$?
wait $PY_PID
PY_STATUS=$?

# Run E2E tests after unit tests complete
if [ $JS_STATUS -eq 0 ] && [ $PY_STATUS -eq 0 ]; then
    run_e2e_tests
    wait $E2E_PID
    E2E_STATUS=$?
else
    E2E_STATUS=1
fi

# Cleanup
echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down

# Report results
echo "📊 Test Results:"
echo "JavaScript Tests: $([ $JS_STATUS -eq 0 ] && echo '✅' || echo '❌')"
echo "Python Tests: $([ $PY_STATUS -eq 0 ] && echo '✅' || echo '❌')"
echo "E2E Tests: $([ $E2E_STATUS -eq 0 ] && echo '✅' || echo '❌')"

# Exit with error if any test suite failed
if [ $JS_STATUS -eq 0 ] && [ $PY_STATUS -eq 0 ] && [ $E2E_STATUS -eq 0 ]; then
    echo "✨ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi 