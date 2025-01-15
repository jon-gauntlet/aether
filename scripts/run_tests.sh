#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting RAG System Test Suite${NC}"
echo "=================================="

# Function to run tests and report results
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Running $suite_name...${NC}"
    echo "-----------------------------------"
    
    if $test_command; then
        echo -e "${GREEN}✓ $suite_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ $suite_name failed${NC}"
        return 1
    fi
}

# Create test results directory
RESULTS_DIR="test_results"
mkdir -p $RESULTS_DIR

# Track overall success
FAILED_SUITES=0

# 1. Property Tests
run_test_suite "Property Tests" "pytest src/rag_aether/ai/testing/property_tests.py -v --html=$RESULTS_DIR/property_tests.html"
FAILED_SUITES=$((FAILED_SUITES + $?))

# 2. Integration Tests
run_test_suite "Integration Tests" "pytest src/rag_aether/ai/testing/integration_tests.py -v --html=$RESULTS_DIR/integration_tests.html"
FAILED_SUITES=$((FAILED_SUITES + $?))

# 3. Performance Tests (with longer timeout)
run_test_suite "Performance Tests" "pytest src/rag_aether/ai/testing/performance_tests.py -v --timeout=300 --html=$RESULTS_DIR/performance_tests.html"
FAILED_SUITES=$((FAILED_SUITES + $?))

# 4. Stress Tests (with even longer timeout)
run_test_suite "Stress Tests" "pytest src/rag_aether/ai/testing/stress_tests.py -v --timeout=600 --html=$RESULTS_DIR/stress_tests.html"
FAILED_SUITES=$((FAILED_SUITES + $?))

# 5. System Tests
run_test_suite "System Tests" "pytest src/rag_aether/ai/testing/test_rag_system.py -v --html=$RESULTS_DIR/system_tests.html"
FAILED_SUITES=$((FAILED_SUITES + $?))

echo -e "\n${YELLOW}Test Suite Summary${NC}"
echo "===================="

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}All test suites passed successfully!${NC}"
    echo -e "\nTest reports available in: $RESULTS_DIR/"
    exit 0
else
    echo -e "${RED}$FAILED_SUITES test suite(s) failed${NC}"
    echo -e "\nCheck detailed reports in: $RESULTS_DIR/"
    exit 1
fi 