#!/usr/bin/env zsh

# Timer function definition
gauntlet_timer() {
    # Only run in interactive shell with arguments
    if [[ ! -o interactive ]] || [[ $# -eq 0 ]]; then
        return 0
    fi
    
    # Run the timer script with arguments
    ~/scripts/automation/gauntlet-timer.sh "$@"
} 