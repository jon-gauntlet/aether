#!/bin/bash

# g - Gauntlet Command Suite
# Unified command system for focus and productivity optimization

# Configuration
GAUNTLET_CONFIG_DIR="$HOME/.config/gauntlet"
GAUNTLET_STATE_DIR="$HOME/.local/state/gauntlet"
GAUNTLET_DATA_DIR="$HOME/.local/share/gauntlet"
BRAINLIFTS_DIR="$HOME/brainlifts"

# Load configuration
if [[ -f "$GAUNTLET_CONFIG_DIR/focus.conf" ]]; then
    source "$GAUNTLET_CONFIG_DIR/focus.conf"
fi

# State files
DEEP_MODE_STATE="$GAUNTLET_STATE_DIR/deep_mode"
FLOW_MODE_STATE="$GAUNTLET_STATE_DIR/flow_mode"
TIMER_PID_FILE="$GAUNTLET_STATE_DIR/timer.pid"
STATS_FILE="$GAUNTLET_DATA_DIR/daily_stats.json"
FOCUS_SESSION_FILE="$GAUNTLET_STATE_DIR/focus_session.json"

# Helper Functions
is_deep_mode() {
    [[ -f "$DEEP_MODE_STATE" ]]
}

is_flow_mode() {
    [[ -f "$FLOW_MODE_STATE" ]]
}

start_deep_mode() {
    touch "$DEEP_MODE_STATE"
    # Focus manager handles the actual state change
    notify-send "Deep Work Mode Enabled" "Notifications and distractions blocked"
}

stop_deep_mode() {
    rm -f "$DEEP_MODE_STATE"
    # Focus manager handles the actual state change
    notify-send "Deep Work Mode Disabled" "Returning to normal operation"
}

start_flow_mode() {
    touch "$FLOW_MODE_STATE"
    # Focus manager handles the actual state change
    notify-send "Flow Mode Enabled" "System optimized for performance"
}

stop_flow_mode() {
    rm -f "$FLOW_MODE_STATE"
    # Focus manager handles the actual state change
    notify-send "Flow Mode Disabled" "System returned to normal"
}

start_timer() {
    local duration=$1
    (
        sleep "${duration}m"
        notify-send "Timer Complete" "${duration} minutes have passed"
        paplay /usr/share/sounds/freedesktop/stereo/complete.oga
        
        # Update session stats
        if [[ -f "$FOCUS_SESSION_FILE" ]]; then
            local temp_file=$(mktemp)
            jq --arg time "$(date -Iseconds)" \
               --arg duration "$duration" \
               '. + {last_timer_end: $time, last_timer_duration: ($duration | tonumber)}' \
               "$FOCUS_SESSION_FILE" > "$temp_file"
            mv "$temp_file" "$FOCUS_SESSION_FILE"
        fi
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
    
    local temp_file=$(mktemp)
    jq --arg date "$date" \
       --arg metric "$metric" \
       --arg value "$value" \
       '.[$date][$metric] = ($value | tonumber)' "$STATS_FILE" > "$temp_file"
    mv "$temp_file" "$STATS_FILE"
    
    # Also update focus session if active
    if [[ -f "$FOCUS_SESSION_FILE" ]]; then
        temp_file=$(mktemp)
        jq --arg metric "last_${metric}" \
           --arg value "$value" \
           '. + {($metric): ($value | tonumber)}' "$FOCUS_SESSION_FILE" > "$temp_file"
        mv "$temp_file" "$FOCUS_SESSION_FILE"
    fi
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
            local duration=${1:-$POMODORO_LENGTH}
            start_timer "$duration"
            notify-send "Timer Started" "Running for ${duration} minutes"
            update_stats "timer_starts" "$(( $(jq -r ".\"$(date +%Y-%m-%d)\".timer_starts // 0" "$STATS_FILE") + 1 ))"
            ;;
            
        stats)
            if [[ -f "$STATS_FILE" ]]; then
                echo "Today's Stats:"
                jq -r ".[\"$(date +%Y-%m-%d)\"] | to_entries | .[] | \"\(.key): \(.value)\"" "$STATS_FILE"
            else
                echo "No stats available for today"
            fi
            
            if [[ -f "$FOCUS_SESSION_FILE" ]]; then
                echo -e "\nCurrent Session:"
                jq -r 'to_entries | .[] | "\(.key): \(.value)"' "$FOCUS_SESSION_FILE"
            fi
            ;;
            
        note)
            local notes_dir="$GAUNTLET_DATA_DIR/notes"
            mkdir -p "$notes_dir"
            if [[ $# -eq 0 ]]; then
                $EDITOR "$notes_dir/$(date +%Y-%m-%d).md"
            else
                echo "$(date +%H:%M): $*" >> "$notes_dir/$(date +%Y-%m-%d).md"
                update_stats "notes_added" "$(( $(jq -r ".\"$(date +%Y-%m-%d)\".notes_added // 0" "$STATS_FILE") + 1 ))"
            fi
            ;;
            
        brain)
            local subcmd=$1
            shift
            case "$subcmd" in
                new)
                    local name=$(date +%Y%m%d_%H%M%S)_brainlift.md
                    $EDITOR "$BRAINLIFTS_DIR/$name"
                    update_stats "brainlifts_created" "$(( $(jq -r ".\"$(date +%Y-%m-%d)\".brainlifts_created // 0" "$STATS_FILE") + 1 ))"
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
            start_timer "${POMODORO_LENGTH:-25}"
            update_stats "focus_sessions" "$(( $(jq -r ".\"$(date +%Y-%m-%d)\".focus_sessions // 0" "$STATS_FILE") + 1 ))"
            ;;
            
        break)
            start_timer "${BREAK_LENGTH:-5}"
            ;;
            
        pomodoro)
            start_timer "${POMODORO_LENGTH:-25}"
            ;;
            
        check)
            g stats
            echo -e "\nSystem Status:"
            echo "Deep Mode: $(is_deep_mode && echo "ON" || echo "OFF")"
            echo "Flow Mode: $(is_flow_mode && echo "ON" || echo "OFF")"
            if [[ -f "$TIMER_PID_FILE" ]]; then
                echo "Timer: Active (PID: $(cat "$TIMER_PID_FILE"))"
            else
                echo "Timer: Inactive"
            fi
            
            # Check focus manager status
            if systemctl is-active --quiet gauntlet-focus.service; then
                echo "Focus Manager: Running"
            else
                echo "Focus Manager: Not Running"
            fi
            ;;
            
        *)
            echo "Gauntlet Command Suite"
            echo "Usage: g <command> [args]"
            echo
            echo "Commands:"
            echo "  deep      - Toggle deep work mode"
            echo "  flow      - Toggle flow state optimizations"
            echo "  timer [m] - Start focus timer (default: ${POMODORO_LENGTH:-25}m)"
            echo "  stats     - Show today's metrics"
            echo "  note      - Quick note capture"
            echo "  brain     - Manage BrainLifts"
            echo "  focus     - Start focused work session"
            echo "  break     - Take a ${BREAK_LENGTH:-5}m break"
            echo "  pomodoro  - Start ${POMODORO_LENGTH:-25}m pomodoro"
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