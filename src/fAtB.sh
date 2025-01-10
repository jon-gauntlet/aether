#!/bin/bash

# Gauntlet Metrics Collection
# Tracks system metrics and user activity

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
STATE_DIR="${HOME}/.gauntlet/state"

# Error handling functions
handle_error() {
    local error_msg="$1"
    local error_file="${METRICS_DIR}/errors_$(date +%Y%m%d).log"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $error_msg" >> "$error_file"
    echo "Error: $error_msg" >&2
}

cleanup_temp_files() {
    local temp_files=("$@")
    for file in "${temp_files[@]}"; do
        [[ -f "$file" ]] && rm -f "$file"
    done
}

validate_numeric() {
    local value="$1"
    local fallback="$2"
    if [[ "$value" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
        echo "$value"
    else
        echo "$fallback"
    fi
}

ensure_directory() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir" || handle_error "Failed to create directory: $dir"
    fi
}

# Ensure required directories exist
for dir in "$METRICS_DIR" "$STATE_DIR"; do
    ensure_directory "$dir"
done

# Initialize metrics files if they don't exist
for metric in focus_time flow_state context_switch typing_speed; do
    if [[ ! -f "${METRICS_DIR}/${metric}.log" ]]; then
        touch "${METRICS_DIR}/${metric}.log" || handle_error "Failed to create ${metric}.log"
    fi
done

# Track typing speed using input events
track_typing_speed() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local typing_file="${METRICS_DIR}/typing_speed.log"
    local temp_file
    temp_file=$(mktemp)
    
    # Get keyboard events in the last minute
    local events
    events=$(xinput list | grep -i keyboard | grep -oP 'id=\K\d+' | while read -r id; do
        xinput --query-state "$id" 2>/dev/null | grep -c "down" || echo "0"
    done | awk '{sum+=$1} END {print sum}')
    
    events=$(validate_numeric "$events" "0")
    echo "${timestamp} ${events}" >> "$typing_file"
}

# Track flow state based on typing speed and focus time
track_flow_state() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local flow_file="${METRICS_DIR}/flow_state.log"
    local typing_file="${METRICS_DIR}/typing_speed.log"
    local focus_file="${METRICS_DIR}/focus_time.log"
    
    # Check recent typing speed
    local recent_typing
    recent_typing=$(tail -n 5 "$typing_file" 2>/dev/null | awk '{sum+=$2} END {print sum/NR}')
    recent_typing=$(validate_numeric "$recent_typing" "0")
    
    # Check recent focus time
    local recent_focus
    recent_focus=$(tail -n 5 "$focus_file" 2>/dev/null | grep -c "1" || echo "0")
    recent_focus=$(validate_numeric "$recent_focus" "0")
    
    # Determine flow state (high typing speed and focused)
    if (( $(echo "$recent_typing > 40" | bc -l) )) && ((recent_focus >= 3)); then
        echo "${timestamp} 1" >> "$flow_file"
    else
        echo "${timestamp} 0" >> "$flow_file"
    fi
}

# Track focus time based on system activity
track_focus_time() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local focus_file="${METRICS_DIR}/focus_time.log"
    local idle_time
    
    # Get X session idle time in milliseconds
    idle_time=$(xprintidle 2>/dev/null || echo "600000")  # Default to 10 minutes if command fails
    idle_time=$(validate_numeric "$idle_time" "600000")
    
    # Consider focused if idle time is less than 5 minutes
    if (( idle_time < 300000 )); then
        echo "${timestamp} 1" >> "$focus_file"
    else
        echo "${timestamp} 0" >> "$focus_file"
    fi
}

# Track context switches based on window focus changes
track_context_switches() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local context_file="${METRICS_DIR}/context_switch.log"
    local current_window
    local last_window
    
    # Get current active window
    current_window=$(xdotool getactivewindow getwindowname 2>/dev/null || echo "")
    last_window=$(cat "${STATE_DIR}/last_window" 2>/dev/null || echo "")
    
    # Update last window
    echo "$current_window" > "${STATE_DIR}/last_window"
    
    # Record context switch if window changed
    if [[ -n "$current_window" && -n "$last_window" && "$current_window" != "$last_window" ]]; then
        echo "${timestamp} 1" >> "$context_file"
    else
        echo "${timestamp} 0" >> "$context_file"
    fi
}

# Main loop
while true; do
    track_typing_speed
    track_flow_state
    track_focus_time
    track_context_switches
    sleep 30
done 