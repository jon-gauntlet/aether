#!/bin/bash

# Context-aware cursor launcher
# Source this file to enable context-aware cursor launching

cursor() {
    local workspace="${1:-.}"
    local abs_path
    abs_path=$(realpath "$workspace")
    local context_type=""
    
    # Detect context type
    if [[ "$abs_path" == "/" ]] || \
       [[ "$abs_path" =~ ^/(etc|usr|var|srv|opt|boot|lib|bin|sbin) ]] || \
       [[ "$abs_path" =~ systemd|system|config ]]; then
        context_type="system"
    elif [[ "$abs_path" =~ /projects/aether(/|$) ]]; then
        context_type="project"
    fi
    
    # Set up context if needed
    if [[ -n "$context_type" ]]; then
        local slice_name="cursor-claude-${context_type}.slice"
        
        # Ensure slice exists and is active
        systemctl --user start "$slice_name" >/dev/null 2>&1 || true
        
        # Initialize context
        /home/jon/scripts/cursor/context-crystallizer "$context_type" >/dev/null 2>&1 || true
        
        # Set environment variables
        export CURSOR_CONTEXT_TYPE="$context_type"
        export CURSOR_WORKSPACE="$abs_path"
        export CURSOR_SLICE="$slice_name"
    fi
    
    # Launch cursor with all arguments
    command cursor "$@"
}

# Export the function
export -f cursor 