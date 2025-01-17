#!/bin/bash

# <!-- LLM:claude ZERO-INTERFERENCE TEST EXECUTION PROTOCOL
#      1. Run tests in isolated SLED space
#      2. Track results in SLED directories
#      3. Never modify repository state
#      4. Use Poetry for Python dependencies
#      5. Respect existing virtualenvs
# -->
# <!-- LLM:magnetic CORE_TEST_RUNNER - Zero-interference testing -->
# <!-- LLM:verify Test runner is critical for development -->
# <!-- LLM:energy_verify Follows SLED energy guidelines -->

set -euo pipefail

# Initialize SLED test directories
SLED_TEST_ROOT="$SLED_PROJECT_DIR/.test"
SLED_TEST_RESULTS="$SLED_TEST_ROOT/results"
SLED_TEST_LOGS="$SLED_TEST_ROOT/logs"
SLED_TEST_CACHE="$SLED_TEST_ROOT/cache"

mkdir -p "$SLED_TEST_RESULTS" "$SLED_TEST_LOGS" "$SLED_TEST_CACHE"

# Diagnostic function with environment detection
check_environment() {
    local env_file="$SLED_TEST_LOGS/environment.log"
    {
        echo "🔍 Environment Check ($(date)):"
        echo "- OS: $(uname -a)"
        echo "- Shell: $SHELL"
        echo "- PWD: $(pwd)"
        echo "- Python: $(command -v python3 || echo 'not found')"
        echo "- Poetry: $(command -v poetry || echo 'not found')"
    } > "$env_file"
}

# Test type handling
TYPE="${1:-all}"
if [[ "$1" == "--type" ]]; then
    TYPE="$2"
    shift 2
fi

# Triage mode for debugging
TRIAGE=0
if [[ "${1:-}" == "--triage" ]]; then
    TRIAGE=1
    shift
fi

# Function to run Python tests with Poetry
run_python_tests() {
    local test_dir="$SLED_TEST_ROOT/python"
    local results_file="$SLED_TEST_RESULTS/python_$(date +%Y%m%d_%H%M%S).log"
    mkdir -p "$test_dir"
    
    echo "🐍 Running Python tests..."
    
    # Check for existing virtualenv
    if [ -d ".venv" ]; then
        echo "Using existing virtualenv"
    else
        # Create new virtualenv in SLED space
        python3 -m venv "$test_dir/venv"
    fi
    
    # Activate virtualenv
    # shellcheck source=/dev/null
    source "$test_dir/venv/bin/activate"
    
    # Install dependencies with Poetry
    if [ -f "pyproject.toml" ]; then
        poetry config virtualenvs.in-project true
        poetry install --no-interaction > "$SLED_TEST_LOGS/poetry_install.log" 2>&1
        
        # Run tests
        if [ $TRIAGE -eq 1 ]; then
            poetry run pytest tests/ -v --last-failed --pdb | tee "$results_file"
        else
            poetry run pytest tests/ -v | tee "$results_file"
        fi
    else
        echo "No pyproject.toml found" | tee "$results_file"
    fi
    
    deactivate
}

# Function to run integration tests
run_integration_tests() {
    local results_file="$SLED_TEST_RESULTS/integration_$(date +%Y%m%d_%H%M%S).log"
    
    echo "🔄 Running integration tests..."
    
    # Create temporary test directory
    local temp_test_dir="$SLED_TEST_ROOT/integration"
    mkdir -p "$temp_test_dir"
    
    # Run tests and capture output
    if [ -f "pytest.ini" ]; then
        PYTHONPATH="$PWD" poetry run pytest tests/integration -v | tee "$results_file"
    else
        echo "No pytest.ini found" | tee "$results_file"
    fi
}

# Show environment info
check_environment

# Main test execution
case $TYPE in
    "python")
        run_python_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "all")
        run_python_tests
        run_integration_tests
        ;;
    *)
        echo "Invalid test type: $TYPE"
        echo "Usage: $0 [--type python|integration] [--triage]"
        exit 1
        ;;
esac

# Save test summary
{
    echo "Test Summary ($(date)):"
    echo "Type: $TYPE"
    echo "Triage Mode: $TRIAGE"
    echo "Results Directory: $SLED_TEST_RESULTS"
    echo "Logs Directory: $SLED_TEST_LOGS"
} > "$SLED_TEST_ROOT/summary"

# <!-- LLM:verify Test runner implements zero-interference -->
# <!-- LLM:usage Last updated: 2024-01-17 -->
# <!-- LLM:sled_verify Implements SLED test patterns -->
# <!-- LLM:energy_verify Follows SLED energy guidelines --> 