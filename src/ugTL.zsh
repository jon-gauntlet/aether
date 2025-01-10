#!/usr/bin/env zsh

# Timer function definition
gauntlet_timer() {
    # Don't run if being sourced
    [[ "${(%):-%N}" != "${0}" ]] && return 0
    
    # Don't run without arguments
    [[ $# -eq 0 ]] && return 0
    
    # Don't run in non-interactive mode
    [[ ! -o interactive ]] && return 0
    
    # Run the timer script with arguments
    ~/scripts/automation/gauntlet-timer.sh "$@"
} 