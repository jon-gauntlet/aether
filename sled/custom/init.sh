#!/bin/bash

# <!-- LLM:claude SLED Python stack initialization with robust copy/branch handling -->
# <!-- LLM:magnetic CORE_PYTHON_STACK -->

# Get repo and branch info for environment isolation
get_repo_info() {
    local repo_path=$(cd "$SLED_PROJECT_ROOT" && pwd)
    local repo_name=$(basename "$repo_path")
    local branch_name=$(cd "$repo_path" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "${repo_name}__${branch_name}"
}

# Python-specific environment setup with branch isolation
setup_python_paths() {
    # Set PYTHONPATH relative to project root
    export PYTHONPATH="${PYTHONPATH:-}"
    if [ -z "$PYTHONPATH" ]; then
        export PYTHONPATH="$SLED_PROJECT_ROOT/src"
    else
        export PYTHONPATH="$SLED_PROJECT_ROOT/src:$PYTHONPATH"
    fi

    # Configure Poetry for branch isolation
    local env_name=$(get_repo_info)
    export POETRY_VIRTUALENVS_IN_PROJECT=false
    export POETRY_VIRTUALENVS_PATH="$HOME/.virtualenvs"
    export POETRY_VIRTUALENVS_CREATE=true
    export POETRY_VIRTUALENVS_PREFER_ACTIVE_PYTHON=true
    export POETRY_VIRTUALENVS_OPTIONS="--prompt=${env_name}"
}

# Python environment management
python_check_venv() {
    local env_name=$(get_repo_info)
    local venv_path="$POETRY_VIRTUALENVS_PATH/${env_name}-py3"
    if [ ! -d "$venv_path" ]; then
        echo "⚠️ No virtual environment found for $env_name"
        return 1
    fi
    return 0
}

python_activate_venv() {
    local env_name=$(get_repo_info)
    local venv_path="$POETRY_VIRTUALENVS_PATH/${env_name}-py3"
    
    if [ -f "$venv_path/bin/activate" ]; then
        source "$venv_path/bin/activate"
        echo "🐍 Activated virtual environment for $env_name"
    else
        echo "⚠️ Virtual environment not found at $venv_path"
        return 1
    fi
}

python_ensure_poetry() {
    if ! command -v poetry &> /dev/null; then
        echo "⚠️ Poetry not found. Installing..."
        curl -sSL https://install.python-poetry.org | python3 -
        export PATH="$HOME/.local/bin:$PATH"
    fi
    poetry --version
}

python_setup() {
    local env_name=$(get_repo_info)
    echo "🔧 Setting up Python environment for $env_name..."
    
    # Initialize paths
    setup_python_paths
    
    # Ensure Poetry is installed
    python_ensure_poetry
    
    # Create/activate virtual environment
    if ! python_check_venv; then
        echo "📦 Creating new virtual environment..."
        cd "$SLED_PROJECT_ROOT"
        poetry env use python3
        poetry install
    fi
    
    python_activate_venv
}

# Export functions
export -f get_repo_info
export -f setup_python_paths
export -f python_check_venv
export -f python_activate_venv
export -f python_ensure_poetry
export -f python_setup

# Run setup
python_setup

# <!-- LLM:verify Python environment is now copy and branch safe -->
# <!-- LLM:usage Updated with robust isolation: 2024-01-16 -->
