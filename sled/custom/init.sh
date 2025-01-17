#!/bin/bash

# <!-- LLM:claude SLED Python stack initialization with zero-interference -->
# <!-- LLM:magnetic CORE_PYTHON_STACK -->

# Initialize SLED Python environment directories
SLED_PYTHON_ROOT="$SLED_PROJECT_DIR/.sled/python"
SLED_PYTHON_STATE="$SLED_PYTHON_ROOT/state"
SLED_PYTHON_VENV="$SLED_PYTHON_ROOT/venv"
SLED_PYTHON_CACHE="$SLED_PYTHON_ROOT/cache"

mkdir -p "$SLED_PYTHON_STATE" "$SLED_PYTHON_VENV" "$SLED_PYTHON_CACHE"

# Get repo info for environment tracking
get_repo_info() {
    local repo_path=$(cd "$SLED_PROJECT_ROOT" && pwd)
    local repo_name=$(basename "$repo_path")
    local branch_name=$(cd "$repo_path" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "${repo_name}__${branch_name}"
}

# Python environment detection
detect_python_env() {
    local env_info="$SLED_PYTHON_STATE/environment"
    local timestamp=$(date +%s)
    
    # Check for Python and Poetry
    {
        echo "timestamp=$timestamp"
        echo "python_version=$(python3 --version 2>/dev/null || echo 'not found')"
        echo "poetry_version=$(poetry --version 2>/dev/null || echo 'not found')"
        echo "repo_info=$(get_repo_info)"
        echo "has_venv=$([[ -d ".venv" ]] && echo 'true' || echo 'false')"
        echo "has_poetry=$([[ -f "pyproject.toml" ]] && echo 'true' || echo 'false')"
    } > "$env_info"
}

# Python path tracking (no modification)
track_python_paths() {
    local paths_file="$SLED_PYTHON_STATE/paths"
    
    # Record current paths
    {
        echo "PYTHONPATH=${PYTHONPATH:-}"
        echo "PATH=${PATH:-}"
        echo "VIRTUAL_ENV=${VIRTUAL_ENV:-}"
    } > "$paths_file"
}

# Virtual environment detection
detect_venv() {
    local venv_info="$SLED_PYTHON_STATE/venv"
    local repo_info=$(get_repo_info)
    
    # Check existing virtualenv
    if [ -d ".venv" ]; then
        echo "type=project" > "$venv_info"
        echo "path=.venv" >> "$venv_info"
    elif [ -n "${VIRTUAL_ENV:-}" ]; then
        echo "type=active" > "$venv_info"
        echo "path=$VIRTUAL_ENV" >> "$venv_info"
    else
        echo "type=none" > "$venv_info"
        echo "path=" >> "$venv_info"
    fi
    
    echo "repo=$repo_info" >> "$venv_info"
    date +%s >> "$venv_info"
}

# Poetry configuration detection
detect_poetry() {
    local poetry_info="$SLED_PYTHON_STATE/poetry"
    
    if [ -f "pyproject.toml" ]; then
        cp "pyproject.toml" "$SLED_PYTHON_CACHE/pyproject.toml"
        echo "has_config=true" > "$poetry_info"
    else
        echo "has_config=false" > "$poetry_info"
    fi
    
    # Check Poetry configuration
    if command -v poetry &> /dev/null; then
        poetry config --list >> "$poetry_info"
    fi
    
    date +%s >> "$poetry_info"
}

# Environment state tracking
track_environment() {
    detect_python_env
    track_python_paths
    detect_venv
    detect_poetry
}

# Export functions for SLED use
export -f get_repo_info
export -f track_environment

# Initialize tracking
track_environment

# <!-- LLM:verify Python environment is tracked with zero-interference -->
# <!-- LLM:usage Updated with zero-interference: 2024-01-17 -->
