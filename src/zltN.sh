#!/usr/bin/env bash

# Focus State Manager for Gauntlet
# Monitors and optimizes focus states during long development sessions

set -euo pipefail

GAUNTLET_ROOT="$HOME/.gauntlet"
METRICS_DIR="$GAUNTLET_ROOT/metrics/monitoring"
STATE_FILE="$GAUNTLET_ROOT/state/focus_state"
ENERGY_LOG="$METRICS_DIR/energy_levels.log"
FOCUS_LOG="$METRICS_DIR/focus_states.log"

# Initialize state tracking
mkdir -p "$(dirname "$STATE_FILE")"
touch "$STATE_FILE"

# Focus state management
declare -A FOCUS_STATES=(
    [FLOW]="Deep work, maximum productivity"
    [ACTIVE]="Engaged but not peak flow"
    [TIRED]="Reduced energy, needs break"
    [RECOVERY]="Active recovery period"
)

log_state() {
    local state="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp - $state" >> "$FOCUS_LOG"
}

log_energy() {
    local level="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp - Energy Level: $level" >> "$ENERGY_LOG"
}

get_current_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo "ACTIVE"
    fi
}

set_state() {
    local new_state="$1"
    echo "$new_state" > "$STATE_FILE"
    log_state "$new_state"
    
    case "$new_state" in
        FLOW)
            # Maximize focus protection
            echo "Enabling maximum focus protection..."
            notify-send "Focus Protection Enabled" "Entering flow state"
            ;;
        ACTIVE)
            # Standard protection
            echo "Standard focus protection active..."
            notify-send "Standard Protection" "Maintaining productive state"
            ;;
        TIRED)
            # Suggest break
            echo "Energy levels low. Consider a break..."
            notify-send "Energy Warning" "Consider taking a short break"
            ;;
        RECOVERY)
            # Initiate recovery protocol
            echo "Initiating recovery protocol..."
            notify-send "Recovery Mode" "Saving context and preparing for break"
            "$GAUNTLET_ROOT/system/recovery/protocol.sh" save_context
            ;;
    esac
}

monitor_activity() {
    local idle_time
    idle_time=$(xprintidle 2>/dev/null || echo "0")
    idle_time=$((idle_time / 1000)) # Convert to seconds
    
    if [ "$idle_time" -gt 1800 ]; then # 30 minutes
        set_state "RECOVERY"
    elif [ "$idle_time" -gt 900 ]; then # 15 minutes
        set_state "TIRED"
    fi
}

suggest_break() {
    local current_state=$(get_current_state)
    if [ "$current_state" = "FLOW" ]; then
        # Check duration in flow state
        local flow_duration=$(grep "FLOW" "$FOCUS_LOG" | tail -n1 | cut -d'-' -f1)
        if [ -n "$flow_duration" ]; then
            local now=$(date +%s)
            local flow_start=$(date -d "$flow_duration" +%s)
            local duration=$((now - flow_start))
            
            if [ "$duration" -gt 7200 ]; then # 2 hours
                notify-send "Flow State Check" "Consider a short break to maintain energy"
            fi
        fi
    fi
}

main() {
    local command="$1"
    shift
    
    case "$command" in
        start)
            set_state "ACTIVE"
            ;;
        flow)
            set_state "FLOW"
            ;;
        break)
            set_state "RECOVERY"
            ;;
        status)
            get_current_state
            ;;
        monitor)
            while true; do
                monitor_activity
                suggest_break
                sleep 300 # Check every 5 minutes
            done
            ;;
        *)
            echo "Usage: $0 {start|flow|break|status|monitor}"
            exit 1
            ;;
    esac
}

main "$@" 