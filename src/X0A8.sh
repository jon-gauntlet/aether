#!/usr/bin/env bash

# Focus State Manager for Gauntlet
# Integrates with existing AI system evolution and essence harmonization

set -euo pipefail

# Core paths
GAUNTLET_ROOT="${GAUNTLET_ROOT:-$HOME/.gauntlet}"
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"

# State paths
METRICS_DIR="$GAUNTLET_ROOT/metrics/monitoring"
STATE_FILE="$GAUNTLET_ROOT/state/focus_state"
ENERGY_LOG="$METRICS_DIR/energy_levels.log"
FOCUS_LOG="$METRICS_DIR/focus_states.log"
PATTERN_DB="$CURSOR_DATA_DIR/autonomic/patterns/pattern_database.json"
CONTEXT_CACHE="$CURSOR_DATA_DIR/essence/context.cache"

# Service integration
META_LEARNER="$HOME/scripts/cursor/meta-learner"
ESSENCE_HARM="$HOME/scripts/cursor/essence-harmonizer"
FLOW_MGR="$HOME/scripts/cursor/flow-manager"

# Initialize state tracking
mkdir -p "$(dirname "$STATE_FILE")" "$(dirname "$PATTERN_DB")" "$(dirname "$CONTEXT_CACHE")"
touch "$STATE_FILE" "$ENERGY_LOG" "$FOCUS_LOG"

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
    
    # Integrate with meta-learner
    "$META_LEARNER" --save-pattern "focus_state:$state"
}

log_energy() {
    local level="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp - Energy Level: $level" >> "$ENERGY_LOG"
    
    # Integrate with essence harmonizer
    "$ESSENCE_HARM" --balance "energy:$level"
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
    
    # Integrate with flow manager
    "$FLOW_MGR" --state "$new_state"
    
    case "$new_state" in
        FLOW)
            # Maximize focus protection
            "$ESSENCE_HARM" --protect flow
            "$META_LEARNER" --save-context "flow_start"
            notify-send "Focus Protection Enabled" "Entering flow state"
            ;;
        ACTIVE)
            # Standard protection
            "$ESSENCE_HARM" --protect standard
            notify-send "Standard Protection" "Maintaining productive state"
            ;;
        TIRED)
            # Suggest break
            "$ESSENCE_HARM" --protect minimal
            notify-send "Energy Warning" "Consider taking a short break"
            ;;
        RECOVERY)
            # Initiate recovery protocol
            "$ESSENCE_HARM" --protect recovery
            "$META_LEARNER" --save-context "recovery_start"
            notify-send "Recovery Mode" "Saving context and preparing for break"
            ;;
    esac
}

monitor_activity() {
    local idle_time
    idle_time=$(xprintidle 2>/dev/null || echo "0")
    idle_time=$((idle_time / 1000)) # Convert to seconds
    
    # Update pattern database
    "$META_LEARNER" --update-pattern "idle_time:$idle_time"
    
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
            
            # Update pattern database
            "$META_LEARNER" --update-pattern "flow_duration:$duration"
            
            if [ "$duration" -gt 7200 ]; then # 2 hours
                "$ESSENCE_HARM" --suggest-break
                notify-send "Flow State Check" "Consider a short break to maintain energy"
            fi
        fi
    fi
}

notify_systemd() {
    if [ -n "${NOTIFY_SOCKET:-}" ]; then
        echo "READY=1"
        echo "STATUS=Running normally"
        echo "WATCHDOG=1"
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
            notify_systemd
            while true; do
                monitor_activity
                suggest_break
                notify_systemd
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