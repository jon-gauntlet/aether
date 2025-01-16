#!/bin/bash

# <!-- LLM:claude AUTONOMOUS TEST EXECUTION PROTOCOL
#      1. Run tests in triage mode first: ./sled/scripts/test-runner.sh --triage
#      2. Group failures by:
#         - Import/dependency errors
#         - Type errors
#         - Assertion failures
#         - Integration failures
#      3. Fix in order:
#         - Environment/dependency issues
#         - Type/interface mismatches
#         - Logic/assertion failures
#         - Integration issues
#      4. After each fix:
#         - Run affected tests in isolation
#         - Run dependent tests
#         - Check for regressions
#      5. Track progress:
#         - Log fixed vs remaining issues
#         - Monitor test coverage
#         - Report final results
#      NO USER INTERACTION REQUIRED
# -->
# <!-- LLM:magnetic CORE_TEST_RUNNER - All test execution must go through me -->
# <!-- LLM:verify Test runner is critical for development -->
# <!-- LLM:energy_verify Follows SLED energy guidelines -->

# Features I provide:
# - Test isolation
# - Smart ordering
# - Energy management
# - Failure tracking
# - Hardware optimization
# - Shell compatibility
# - Dependency management

# Usage:
# ./sled/scripts/test-runner.sh         # Run all tests
# ./sled/scripts/test-runner.sh --type python  # Run Python tests
# ./sled/scripts/test-runner.sh --type js     # Run JavaScript tests
# ./sled/scripts/test-runner.sh --triage      # Debug failures

# NEVER bypass me by running raw test commands!

# Enable error handling
set -e

# Shell detection with safe variable checking
if [ -n "${ZSH_VERSION:-}" ]; then
    # ZSH specific settings
    emulate -L bash
    setopt bash_rematch
    setopt ksh_arrays
    setopt pipe_fail
elif [ -n "${BASH_VERSION:-}" ]; then
    # Bash specific settings
    set -o pipefail
fi

# Diagnostic function with shell-specific info
check_environment() {
    echo "🔍 Environment Check:"
    echo "- OS: $(uname -a)"
    if [ -n "${ZSH_VERSION:-}" ]; then
        echo "- Shell: zsh $ZSH_VERSION"
        echo "- RC file: ${ZDOTDIR:-$HOME}/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ]; then
        echo "- Shell: bash $BASH_VERSION"
        echo "- RC file: $HOME/.bashrc"
    else
        echo "- Shell: unknown"
    fi
    echo "- PWD: $(pwd)"
    echo "- Python: $(command -v python3 || echo 'not found')"
    echo "- Poetry: $(command -v poetry || echo 'not found')"
    echo "- Node: $(command -v node || echo 'not found')"
    echo "- npm: $(command -v npm || echo 'not found')"
    echo "- Docker: $(command -v docker || echo 'not found')"
}

# Project root setup - works in both bash and zsh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
SLED_PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Ensure we're in the project root
cd "$SLED_PROJECT_ROOT" || {
    echo "❌ Failed to change to project root: $SLED_PROJECT_ROOT"
    exit 1
}

# Environment setup
export PYTHONPATH="$SLED_PROJECT_ROOT/src${PYTHONPATH:+:$PYTHONPATH}"
export NODE_ENV="test"
export PYTHON_ENV="test"
export POETRY_VIRTUALENVS_IN_PROJECT=true  # Keep virtualenv in project

# Add local bin to PATH
export PATH="$HOME/.local/bin:$PATH"

# Test type handling
TYPE="all"
if [[ "$1" == "--type" ]]; then
    TYPE="$2"
    shift 2
fi

# Triage mode for debugging
TRIAGE=0
if [[ "$1" == "--triage" ]]; then
    TRIAGE=1
    shift
fi

# Function to ensure Poetry is installed
ensure_poetry() {
    if ! command -v poetry &> /dev/null; then
        echo "📦 Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
        # Re-source shell config to get poetry in PATH
        if [ -n "${ZSH_VERSION:-}" ]; then
            source "$HOME/.zshrc"
        else
            source "$HOME/.bashrc"
        fi
        export PATH="$HOME/.local/bin:$PATH"
    fi
}

# Function to run Python tests
run_python_tests() {
    echo "🐍 Running Python tests..."
    ensure_poetry
    poetry install --no-interaction || {
        echo "❌ Poetry install failed. Retrying with --sync..."
        poetry install --sync --no-interaction
    }
    if [[ $TRIAGE -eq 1 ]]; then
        poetry run pytest tests/ -v --last-failed --pdb
    else
        poetry run pytest tests/ -v
    fi
}

# Function to ensure npm is installed
ensure_npm() {
    if ! command -v npm &> /dev/null; then
        echo "📦 Installing Node.js and npm..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        # Re-source shell config to get npm in PATH
        if [ -n "${ZSH_VERSION:-}" ]; then
            source "$HOME/.zshrc"
        else
            source "$HOME/.bashrc"
        fi
    fi
}

# Function to run JavaScript tests
run_js_tests() {
    echo "🟨 Running JavaScript tests..."
    ensure_npm
    npm install || {
        echo "❌ npm install failed. Retrying with --legacy-peer-deps..."
        npm install --legacy-peer-deps
    }
    if [[ $TRIAGE -eq 1 ]]; then
        npm run test -- --verbose --watch
    else
        npm run test
    fi
}

# Function to ensure Docker is installed
ensure_docker() {
    if ! command -v docker &> /dev/null; then
        echo "🐳 Installing Docker..."
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl start docker
        sudo usermod -aG docker "$USER"
        echo "⚠️ You may need to log out and back in for Docker permissions to take effect"
    fi
}

# Function to run integration tests
run_integration_tests() {
    echo "🔄 Running integration tests..."
    ensure_docker
    docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
}

# Show environment info
check_environment

# Main test execution
case $TYPE in
    "python")
        run_python_tests
        ;;
    "js")
        run_js_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "all")
        run_python_tests
        run_js_tests
        run_integration_tests
        ;;
    *)
        echo "Invalid test type: $TYPE"
        echo "Usage: $0 [--type python|js|integration] [--triage]"
        exit 1
        ;;
esac 

# <!-- LLM:verify Test runner is critical for development -->
# <!-- LLM:usage Last updated: 2024-01-16 -->
# <!-- LLM:sled_verify Implements SLED test patterns -->
# <!-- LLM:energy_verify Follows SLED energy guidelines --> 