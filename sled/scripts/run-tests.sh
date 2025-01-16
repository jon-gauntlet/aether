#!/bin/bash

# <!-- LLM:component SLED_TEST_RUNNER -->
# <!-- LLM:claude I handle test execution with proper environment setup -->

set -euo pipefail

# Set up environment
export SLED_PROJECT_ROOT=${SLED_PROJECT_ROOT:-$(git rev-parse --show-toplevel)}
export SLED_PROJECT_DIR="$SLED_PROJECT_ROOT/sled"
export PYTHONPATH="$SLED_PROJECT_ROOT/src:${PYTHONPATH:-}"
export POETRY_VIRTUALENVS_IN_PROJECT=true

# Source SLED environment
source "$SLED_PROJECT_DIR/env.sh"

# Ensure poetry and virtualenv
python_setup

# Run tests with proper configuration
cd "$SLED_PROJECT_ROOT"
poetry run pytest "$@" -v 