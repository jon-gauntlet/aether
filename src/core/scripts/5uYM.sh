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

ensure_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        touch "$file" || handle_error "Failed to create file: $file"
    fi
}

# Ensure directories and files exist
mkdir -p "$METRICS_DIR" "$CONTEXT_DIR" "$STATE_DIR" || {
    handle_error "Failed to create required directories"
    exit 1
}

for file in "$TYPING_SPEED_FILE" "$LAST_WINDOW_FILE" "$CONTEXT_SWITCH_FILE" "$FLOW_STATE_FILE"; do
    ensure_file "$file"
done

log_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure cleanup
    trap 'cleanup_temp_files "$temp_file"' EXIT
    
    # Validate metric value
    metric_value=$(validate_numeric "$metric_value" "0")
    
    # Write to temp file first
    echo "${timestamp} ${metric_value}" > "$temp_file" || {
        handle_error "Failed to write metric to temp file: ${metric_name}"
        return 1
    }
    
    # Atomic append to metric file
    cat "$temp_file" >> "${METRICS_DIR}/${metric_name}.log" || {
        handle_error "Failed to append metric to log: ${metric_name}"
        return 1
    }
}

track_editor_sessions() {
    local editor_count
    editor_count=$(pgrep -f "cursor|code" | wc -l || echo "0")
    editor_count=$(validate_numeric "$editor_count" "0")
    log_metric "editor_sessions" "$editor_count"
}

track_focus_time() {
    local active_window
    local last_window
    
    # Get active window with error handling
    if ! active_window=$(xdotool getwindowfocus getwindowname 2>/dev/null); then
        handle_error "Failed to get active window"
        active_window="unknown"
    fi
    
    # Get last window with validation
    last_window=$(cat "$LAST_WINDOW_FILE" 2>/dev/null || echo "unknown")
    
    # Track context switches
    if [[ "$active_window" != "$last_window" ]]; then
        log_metric "context_switch" "1"
        echo "$active_window" > "$LAST_WINDOW_FILE" || handle_error "Failed to update last window"
    fi
    
    if [[ "$active_window" =~ (Cursor|Code) ]]; then
        log_metric "focus_time" "1"
        
        # Check for flow state with validation
        local focus_duration
        focus_duration=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null || echo "0")
        focus_duration=$(validate_numeric "$focus_duration" "0")
        
        if ((focus_duration > 30)); then  # 30 * 30s = 15 minutes
            log_metric "flow_state" "1"
            echo "1" > "$FLOW_STATE_FILE" || handle_error "Failed to update flow state"
        fi
    else
        log_metric "focus_time" "0"
        echo "0" > "$FLOW_STATE_FILE" || handle_error "Failed to update flow state"
    fi
}

track_typing_speed() {
    # Only track if in flow state
    if [[ -f "$FLOW_STATE_FILE" ]] && [[ "$(cat "$FLOW_STATE_FILE")" == "1" ]]; then
        local key_count
        local last_count
        
        # Get current key count with error handling
        if ! key_count=$(xinput list-props "AT Translated Set 2 keyboard" 2>/dev/null | grep "Key Press Count" | awk '{print $NF}'); then
            handle_error "Failed to get key press count"
            return 1
        fi
        
        # Validate key count
        key_count=$(validate_numeric "$key_count" "0")
        
        # Get last count with validation
        last_count=$(cat "$TYPING_SPEED_FILE" 2>/dev/null || echo "$key_count")
        last_count=$(validate_numeric "$last_count" "$key_count")
        
        # Calculate and log typing speed
        local keys_per_minute=$((key_count - last_count))
        keys_per_minute=$(validate_numeric "$keys_per_minute" "0")
        
        log_metric "typing_speed" "$keys_per_minute"
        echo "$key_count" > "$TYPING_SPEED_FILE" || handle_error "Failed to update typing speed"
    fi
}

track_system_load() {
    local load
    # Get system load with error handling
    if ! load=$(cat /proc/loadavg | cut -d' ' -f1-3); then
        handle_error "Failed to get system load"
        load="0 0 0"
    fi
    log_metric "system_load" "$load"
}

track_memory_usage() {
    local mem_usage
    # Get memory usage with error handling
    if ! mem_usage=$(ps -eo pmem,comm | grep -E 'cursor|code' | awk '{sum+=$1} END {print sum}' || echo "0"); then
        handle_error "Failed to get memory usage"
        mem_usage="0"
    fi
    mem_usage=$(validate_numeric "$mem_usage" "0")
    log_metric "memory_usage" "$mem_usage"
}

track_active_files() {
    if [[ -f "$FLOW_STATE_FILE" ]] && [[ "$(cat "$FLOW_STATE_FILE")" == "1" ]]; then
        local temp_file
        temp_file=$(mktemp)
        
        # Ensure cleanup
        trap 'cleanup_temp_files "$temp_file"' EXIT
        
        # Get active files with error handling
        if ! lsof -p "$(pgrep -f "cursor|code" | tr '\n' ',')" 2>/dev/null | \
            grep REG | grep -E '\.(py|js|ts|go|rs|cpp|h|c|java|sh|md)$' | \
            awk '{print $9}' | sort -u > "$temp_file"; then
            handle_error "Failed to get active files"
            return 1
        fi
        
        # Only update if we have content
        if [[ -s "$temp_file" ]]; then
            mv "$temp_file" "${METRICS_DIR}/active_files" || handle_error "Failed to update active files"
        fi
    fi
}

track_git_activity() {
    if [[ -d "${HOME}/workspace" ]]; then
        local git_changes
        # Get git changes with error handling
        if ! git_changes=$(cd "${HOME}/workspace" && git status --porcelain 2>/dev/null | wc -l); then
            handle_error "Failed to get git changes"
            git_changes="0"
        fi
        git_changes=$(validate_numeric "$git_changes" "0")
        log_metric "git_changes" "$git_changes"
    fi
}

cleanup_old_logs() {
    local days="$1"
    # Clean old logs with error handling
    if ! find "$METRICS_DIR" -type f -mtime +"$days" -delete 2>/dev/null; then
        handle_error "Failed to clean old logs"
        return 1
    fi
}

# Main monitoring loop with error handling
main() {
    while true; do
        track_editor_sessions || handle_error "Failed to track editor sessions"
        track_focus_time || handle_error "Failed to track focus time"
        track_typing_speed || handle_error "Failed to track typing speed"
        track_system_load || handle_error "Failed to track system load"
        track_memory_usage || handle_error "Failed to track memory usage"
        track_active_files || handle_error "Failed to track active files"
        track_git_activity || handle_error "Failed to track git activity"
        
        # Clean old logs every hour
        if [[ "$(date +%M)" == "00" ]]; then
            cleanup_old_logs 7 || handle_error "Failed to clean old logs"
        fi
        
        sleep 30
    done
}

# Start main loop with error handling
main || handle_error "Main loop failed" 