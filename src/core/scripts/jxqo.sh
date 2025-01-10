#!/bin/bash

# Gauntlet Metrics Collection Script
# Tracks development session metrics for optimization

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
CONTEXT_DIR="${HOME}/.gauntlet/contexts"
STATE_DIR="${HOME}/.gauntlet/state"

mkdir -p "$METRICS_DIR" "$CONTEXT_DIR" "$STATE_DIR"

log_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    echo "${timestamp} ${metric_value}" >> "${METRICS_DIR}/${metric_name}.log"
}

track_editor_sessions() {
    # Track active editor windows
    pgrep -f "cursor|code" | wc -l
}

track_focus_time() {
    # Track continuous typing/coding periods
    local active_window
    active_window=$(xdotool getwindowfocus getwindowname)
    if [[ "$active_window" =~ (Cursor|Code) ]]; then
        log_metric "focus_time" "1"
    else
        log_metric "focus_time" "0"
    fi
}

track_system_load() {
    # System load averages
    local load
    load=$(cat /proc/loadavg | cut -d' ' -f1-3)
    log_metric "system_load" "$load"
}

track_memory_usage() {
    # Memory usage for development processes
    local mem_usage
    mem_usage=$(ps -eo pmem,comm | grep -E 'cursor|code' | awk '{sum+=$1} END {print sum}')
    log_metric "memory_usage" "$mem_usage"
}

# Main monitoring loop
while true; do
    track_editor_sessions
    track_focus_time
    track_system_load
    track_memory_usage
    
    # Clean old logs (keep last 7 days)
    find "$METRICS_DIR" -type f -mtime +7 -delete
    
    sleep 30
done 