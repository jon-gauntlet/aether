#!/bin/bash

# Simple context-aware cursor launcher functions
# Source this file to enable project-claude and system-claude commands

project-claude() {
    local workspace="${1:-/home/jon/projects/aether}"
    
    # Set up project context
    export CURSOR_CONTEXT_TYPE="project"
    export CURSOR_WORKSPACE="$workspace"
    export CURSOR_SLICE="cursor-claude-project.slice"
    
    # Ensure slice exists
    systemctl --user start cursor-claude-project.slice >/dev/null 2>&1 || true
    
    # Launch cursor
    cursor "$workspace"
}

system-claude() {
    local workspace="${1:-/home/jon/ai_system_evolution}"
    
    # Set up system context
    export CURSOR_CONTEXT_TYPE="system"
    export CURSOR_WORKSPACE="$workspace"
    export CURSOR_SLICE="cursor-claude-system.slice"
    
    # Ensure slice exists
    systemctl --user start cursor-claude-system.slice >/dev/null 2>&1 || true
    
    # Launch cursor
    cursor "$workspace"
}

# Export the functions
export -f project-claude
export -f system-claude 