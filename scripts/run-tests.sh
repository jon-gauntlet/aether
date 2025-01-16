#!/bin/bash

# Simple mode flag
DEV_MODE=false
CI_MODE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) DEV_MODE=true ;;
        --ci) CI_MODE=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting test suite..."

# Function to run tests
run_tests() {
    local test_type=$1
    local command=$2
    
    echo "Running ${test_type} tests..."
    if $command; then
        echo -e "${GREEN}✓ ${test_type} tests passed${NC}"
        return 0
    else
        echo -e "${RED}✗ ${test_type} tests failed${NC}"
        return 1
    fi
}

# Dev mode - quick tests without infrastructure
if $DEV_MODE; then
    echo "🔧 Running in development mode (minimal infrastructure)"
    run_tests "JavaScript" "npm test"
    run_tests "Python" "pytest tests/rag_aether/unit/"
    exit $?
fi

# CI mode - full test suite with all checks
if $CI_MODE; then
    echo "🏗️ Running in CI mode (full infrastructure)"
    
    # Start required services
    echo "Starting services..."
    docker-compose up -d redis elasticsearch minio

    # Wait for services
    echo "Waiting for services..."
    sleep 5

    # Run all test suites
    run_tests "JavaScript" "npm test" && \
    run_tests "Python" "pytest tests/rag_aether/" && \
    run_tests "E2E" "npm run test:e2e"
    
    result=$?
    
    # Cleanup
    echo "Cleaning up services..."
    docker-compose down
    
    exit $result
fi

# Default mode - balanced approach
echo "⚡ Running standard test suite"
run_tests "JavaScript" "npm test" && \
run_tests "Python" "pytest tests/rag_aether/unit/ tests/rag_aether/integration/"

exit $? 