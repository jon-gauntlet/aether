#!/bin/bash

# Gauntlet Metrics Collection Script
# Tracks development session metrics with ADHD focus

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
CONTEXT_DIR="${HOME}/.gauntlet/contexts"
STATE_DIR="${HOME}/.gauntlet/state"
TYPING_SPEED_FILE="${STATE_DIR}/typing_speed"
LAST_WINDOW_FILE="${STATE_DIR}/last_window"
CONTEXT_SWITCH_FILE="${STATE_DIR}/context_switches"
FLOW_STATE_FILE="${STATE_DIR}/flow_state"

mkdir -p "$METRICS_DIR" "$CONTEXT_DIR" "$STATE_DIR"
touch "$TYPING_SPEED_FILE" "$LAST_WINDOW_FILE" "$CONTEXT_SWITCH_FILE" "$FLOW_STATE_FILE"

log_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    echo "${timestamp} ${metric_value}" >> "${METRICS_DIR}/${metric_name}.log"
}

track_editor_sessions() {
    # Track active editor windows
    local editor_count
    editor_count=$(pgrep -f "cursor|code" | wc -l || echo "0")
    log_metric "editor_sessions" "$editor_count"
}

track_focus_time() {
    # Track continuous typing/coding periods
    local active_window
    active_window=$(xdotool getwindowfocus getwindowname 2>/dev/null || echo "unknown")
    
    # Get last window
    local last_window
    last_window=$(cat "$LAST_WINDOW_FILE" 2>/dev/null || echo "unknown")
    
    # Track context switches
    if [[ "$active_window" != "$last_window" ]]; then
        log_metric "context_switch" "1"
        echo "$active_window" > "$LAST_WINDOW_FILE"
    fi
    
    if [[ "$active_window" =~ (Cursor|Code) ]]; then
        log_metric "focus_time" "1"
        
        # Check for flow state (>15 minutes continuous focus)
        local focus_duration
        focus_duration=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null || echo "0")
        if ((focus_duration > 30)); then  # 30 * 30s = 15 minutes
            log_metric "flow_state" "1"
            echo "1" > "$FLOW_STATE_FILE"
        fi
    else
        log_metric "focus_time" "0"
        echo "0" > "$FLOW_STATE_FILE"
    fi
}

track_typing_speed() {
    # Track typing speed using xinput if in focus
    if [[ -f "$FLOW_STATE_FILE" ]] && [[ $(cat "$FLOW_STATE_FILE") == "1" ]]; then
        local key_count
        key_count=$(xinput list-props "AT Translated Set 2 keyboard" 2>/dev/null | grep "Key Press Count" | awk '{print $NF}' || echo "0")
        if [[ -n "$key_count" ]] && [[ "$key_count" =~ ^[0-9]+$ ]]; then
            local last_count
            last_count=$(cat "$TYPING_SPEED_FILE" 2>/dev/null || echo "$key_count")
            if [[ "$last_count" =~ ^[0-9]+$ ]]; then
                local keys_per_minute=$((key_count - last_count))
                log_metric "typing_speed" "$keys_per_minute"
                echo "$key_count" > "$TYPING_SPEED_FILE"
            fi
        fi
    fi
}

track_system_load() {
    # System load averages
    local load
    load=$(cat /proc/loadavg | cut -d' ' -f1-3 || echo "0 0 0")
    log_metric "system_load" "$load"
}

track_memory_usage() {
    # Memory usage for development processes
    local mem_usage
    mem_usage=$(ps -eo pmem,comm | grep -E 'cursor|code' | awk '{sum+=$1} END {print sum}' || echo "0")
    log_metric "memory_usage" "$mem_usage"
}

track_active_files() {
    # Track which files are being edited
    if [[ -f "$FLOW_STATE_FILE" ]] && [[ $(cat "$FLOW_STATE_FILE") == "1" ]]; then
        local active_files
        active_files=$(lsof -p $(pgrep -f "cursor|code") 2>/dev/null | grep REG | grep -E '\.(py|js|ts|go|rs|cpp|h|c|java|sh|md)$' | awk '{print $9}' | sort -u || echo "")
        if [[ -n "$active_files" ]]; then
            echo "$active_files" > "${METRICS_DIR}/active_files"
        fi
    fi
}

track_git_activity() {
    # Track git activity in workspace
    if [[ -d "${HOME}/workspace" ]]; then
        local git_changes
        git_changes=$(cd "${HOME}/workspace" && git status --porcelain 2>/dev/null | wc -l || echo "0")
        log_metric "git_changes" "$git_changes"
    fi
}

# Main monitoring loop
while true; do
    track_editor_sessions
    track_focus_time
    track_typing_speed
    track_system_load
    track_memory_usage
    track_active_files
    track_git_activity
    
    # Clean old logs (keep last 7 days)
    find "$METRICS_DIR" -type f -mtime +7 -delete
    
    sleep 30
done 