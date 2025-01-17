#!/bin/bash

# <!-- LLM:claude Zero-interference test runner wrapper -->
# <!-- LLM:magnetic TEST_RUNNER_WRAPPER -->

set -euo pipefail

# Initialize test environment
SLED_TEST_ROOT="$SLED_PROJECT_DIR/.test"
SLED_TEST_RESULTS="$SLED_TEST_ROOT/results"
SLED_TEST_LOGS="$SLED_TEST_ROOT/logs"

mkdir -p "$SLED_TEST_RESULTS" "$SLED_TEST_LOGS"

# Log test run
log_test_run() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local log_file="$SLED_TEST_LOGS/run_$timestamp.log"
    {
        echo "Test Run Started: $(date)"
        echo "Arguments: $*"
        echo "Working Directory: $PWD"
    } > "$log_file"
    echo "$log_file"
}

# Run tests with logging
LOG_FILE=$(log_test_run "$@")
"$SLED_PROJECT_DIR/custom/test/test-runner.sh" "$@" 2>&1 | tee -a "$LOG_FILE"

# Save exit status
TEST_STATUS=${PIPESTATUS[0]}

# Log completion
{
    echo "Test Run Completed: $(date)"
    echo "Exit Status: $TEST_STATUS"
} >> "$LOG_FILE"

exit $TEST_STATUS 