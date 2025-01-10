#!/bin/bash

# g - Gauntlet Command Suite
# Unified command system for focus and productivity optimization

# Configuration
GAUNTLET_CONFIG_DIR="$HOME/.config/gauntlet"
GAUNTLET_STATE_DIR="$HOME/.local/state/gauntlet"
GAUNTLET_DATA_DIR="$HOME/.local/share/gauntlet"
BRAINLIFTS_DIR="$HOME/brainlifts"

# Ensure required directories exist
mkdir -p "$GAUNTLET_CONFIG_DIR" "$GAUNTLET_STATE_DIR" "$GAUNTLET_DATA_DIR" "$BRAINLIFTS_DIR"

# State files
DEEP_MODE_STATE="$GAUNTLET_STATE_DIR/deep_mode"
FLOW_MODE_STATE="$GAUNTLET_STATE_DIR/flow_mode"
TIMER_PID_FILE="$GAUNTLET_STATE_DIR/timer.pid"
STATS_FILE="$GAUNTLET_DATA_DIR/daily_stats.json"

# Helper Functions
is_deep_mode() {
    [[ -f "$DEEP_MODE_STATE" ]]
}

is_flow_mode() {
    [[ -f "$FLOW_MODE_STATE" ]]
}

start_deep_mode() {
    touch "$DEEP_MODE_STATE"
    notify-send "Deep Work Mode Enabled" "Notifications and distractions blocked"
    # Add system-specific notification blocking here
}

stop_deep_mode() {
    rm -f "$DEEP_MODE_STATE"
    notify-send "Deep Work Mode Disabled" "Returning to normal operation"
    # Remove notification blocks here
}

start_flow_mode() {
    touch "$FLOW_MODE_STATE"
    sudo cpupower frequency-set -g performance
    notify-send "Flow Mode Enabled" "System optimized for performance"
}

stop_flow_mode() {
    rm -f "$FLOW_MODE_STATE"
    sudo cpupower frequency-set -g powersave
    notify-send "Flow Mode Disabled" "System returned to normal"
}

start_timer() {
    local duration=$1
    (
        sleep "${duration}m"
        notify-send "Timer Complete" "${duration} minutes have passed"
        paplay /usr/share/sounds/freedesktop/stereo/complete.oga
    ) &
    echo $! > "$TIMER_PID_FILE"
}

update_stats() {
    local metric=$1
    local value=$2
    local date=$(date +%Y-%m-%d)
    
    if [[ ! -f "$STATS_FILE" ]]; then
        echo "{}" > "$STATS_FILE"
    fi
    
    # Update stats using jq
    local temp_file=$(mktemp)
    jq --arg date "$date" --arg metric "$metric" --arg value "$value" \
        '.[$date][$metric] = ($value | tonumber)' "$STATS_FILE" > "$temp_file"
    mv "$temp_file" "$STATS_FILE"
}

# Main Command Handler
g() {
    local cmd=$1
    shift

    case "$cmd" in
        deep)
            if is_deep_mode; then
                stop_deep_mode
            else
                start_deep_mode
            fi
            ;;
            
        flow)
            if is_flow_mode; then
                stop_flow_mode
            else
                start_flow_mode
            fi
            ;;
            
        timer)
            local duration=${1:-25}
            start_timer "$duration"
            notify-send "Timer Started" "Running for ${duration} minutes"
            ;;
            
        stats)
            if [[ -f "$STATS_FILE" ]]; then
                jq ".[\"$(date +%Y-%m-%d)\"]" "$STATS_FILE"
            else
                echo "No stats available for today"
            fi
            ;;
            
        note)
            if [[ $# -eq 0 ]]; then
                $EDITOR "$GAUNTLET_DATA_DIR/notes/$(date +%Y-%m-%d).md"
            else
                echo "$(date +%H:%M): $*" >> "$GAUNTLET_DATA_DIR/notes/$(date +%Y-%m-%d).md"
            fi
            ;;
            
        brain)
            local subcmd=$1
            shift
            case "$subcmd" in
                new)
                    local name=$(date +%Y%m%d_%H%M%S)_brainlift.md
                    $EDITOR "$BRAINLIFTS_DIR/$name"
                    ;;
                list)
                    ls -l "$BRAINLIFTS_DIR" | grep "brainlift.md"
                    ;;
                *)
                    echo "Usage: g brain [new|list]"
                    ;;
            esac
            ;;
            
        focus)
            start_deep_mode
            start_flow_mode
            start_timer 25
            ;;
            
        break)
            start_timer 5
            ;;
            
        pomodoro)
            start_timer 25
            ;;
            
        check)
            g stats
            echo "System Status:"
            echo "Deep Mode: $(is_deep_mode && echo "ON" || echo "OFF")"
            echo "Flow Mode: $(is_flow_mode && echo "ON" || echo "OFF")"
            if [[ -f "$TIMER_PID_FILE" ]]; then
                echo "Timer: Active (PID: $(cat "$TIMER_PID_FILE"))"
            else
                echo "Timer: Inactive"
            fi
            ;;
            
        *)
            echo "Gauntlet Command Suite"
            echo "Usage: g <command> [args]"
            echo
            echo "Commands:"
            echo "  deep      - Toggle deep work mode"
            echo "  flow      - Toggle flow state optimizations"
            echo "  timer [m] - Start focus timer (default: 25m)"
            echo "  stats     - Show today's metrics"
            echo "  note      - Quick note capture"
            echo "  brain     - Manage BrainLifts"
            echo "  focus     - Start focused work session"
            echo "  break     - Take a 5min break"
            echo "  pomodoro  - Start 25min pomodoro"
            echo "  check     - Show system status"
            ;;
    esac
}

# Export the function if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f g
else
    g "$@"
fi 