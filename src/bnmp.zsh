#!/usr/bin/env zsh

# Timer function definition
function gauntlet_timer {
    if [[ $# -eq 0 ]]; then
        return 0
    fi
    ~/scripts/automation/gauntlet-timer.sh "$@"
}

# Export the function
export -f gauntlet_timer 