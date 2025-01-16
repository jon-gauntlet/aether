#!/bin/bash

# <!-- LLM:component SLED_STACK_PYTHON -->
# <!-- LLM:claude I am the Python stack initialization for SLED -->

set -euo pipefail

# Python-specific environment setup
export PYTHONPATH="${PYTHONPATH:-}"
if [ -z "$PYTHONPATH" ]; then
    export PYTHONPATH="$SLED_PROJECT_ROOT/src"
else
    export PYTHONPATH="$SLED_PROJECT_ROOT/src:$PYTHONPATH"
fi
export POETRY_VIRTUALENVS_IN_PROJECT=true

# Python-specific functions
python_check_venv() {
    if [ ! -d "$SLED_PROJECT_ROOT/.venv" ]; then
        echo "⚠️ No virtual environment found"
        return 1
    fi
    return 0
}

python_activate_venv() {
    if [ -f "$SLED_PROJECT_ROOT/.venv/bin/activate" ]; then
        source "$SLED_PROJECT_ROOT/.venv/bin/activate"
        echo "🐍 Virtual environment activated"
    fi
}

python_ensure_poetry() {
    if ! command -v poetry &> /dev/null; then
        echo "⚠️ Poetry not found. Installing..."
        curl -sSL https://install.python-poetry.org | python3 -
    fi
}

python_setup() {
    # Ensure Poetry is installed
    python_ensure_poetry
    
    # Create virtual environment if needed
    if ! python_check_venv; then
        echo "🔧 Setting up Python environment..."
        poetry install
    fi
    
    # Activate virtual environment
    python_activate_venv
}

# Export functions
export -f python_check_venv
export -f python_activate_venv
export -f python_ensure_poetry
export -f python_setup

# Run setup
python_setup

# <!-- LLM:verify Python stack initialization is essential for Python projects -->
# <!-- LLM:usage Last updated: 2024-01-16 -->
