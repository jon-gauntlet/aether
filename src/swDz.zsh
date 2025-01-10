#!/usr/bin/env zsh

# Timer function definition
gauntlet_timer() {
    emulate -L zsh
    if [[ $# -eq 0 ]]; then
        return 0
    fi
    ~/scripts/automation/gauntlet-timer.sh "$@"
} 