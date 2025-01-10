#!/bin/bash

set -euo pipefail

# Environment setup
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
GAUNTLET_DATA_DIR="${GAUNTLET_DATA_DIR:-$HOME/.local/share/gauntlet}"

# Ensure directories exist
mkdir -p "$GAUNTLET_DATA_DIR"/{stats,metrics,state}

# Logging function
log() {
    echo "[$(date -Iseconds)] $*"
}

# Notify systemd watchdog
notify_watchdog() {
    echo "WATCHDOG=1"
}

# Get JSON value with default
get_json_value() {
    local file="$1"
    local key="$2"
    local default="$3"
    
    if [[ -f "$file" ]]; then
        jq -r ".$key // $default" "$file" 2>/dev/null || echo "$default"
    else
        echo "$default"
    fi
}

# Calculate percentage safely
calc_percentage() {
    local used="$1"
    local total="$2"
    if [[ "$total" -eq 0 ]]; then
        echo "0"
    else
        awk "BEGIN {printf \"%.2f\", ($used * 100 / $total)}"
    fi
}

# Ensure numeric value
ensure_numeric() {
    local value="$1"
    if [[ "$value" =~ ^[0-9]+\.?[0-9]*$ ]]; then
        echo "$value"
    else
        echo "0"
    fi
}

# Create JSON metrics
create_json_metrics() {
    local cpu_usage="$1"
    local mem_usage="$2"
    local swap_usage="$3"
    local disk_usage="$4"
    local current_stats="$5"
    local focus_metrics_file="$6"
    
    # Get focus metrics with defaults
    local deep_mode=$(get_json_value "$focus_metrics_file" "deep_mode_duration" "0")
    local flow_state=$(get_json_value "$focus_metrics_file" "flow_state_duration" "0")
    local focus_sessions=$(get_json_value "$focus_metrics_file" "focus_sessions" "0")
    
    # Ensure current_stats is valid JSON
    if ! echo "$current_stats" | jq . >/dev/null 2>&1; then
        current_stats="{}"
    fi
    
    # Create base metrics object
    local metrics_json="{
        \"timestamp\": \"$(date -Iseconds)\",
        \"daily_stats\": $current_stats,
        \"system_metrics\": {
            \"cpu_usage\": $cpu_usage,
            \"memory_usage\": $mem_usage,
            \"swap_usage\": $swap_usage,
            \"disk_usage\": $disk_usage
        },
        \"focus_metrics\": {
            \"deep_mode_duration\": $deep_mode,
            \"flow_state_duration\": $flow_state,
            \"focus_sessions\": $focus_sessions
        }
    }"
    
    # Format and validate JSON
    echo "$metrics_json" | jq .
}

# Optimize gauntlet performance
optimize_gauntlet() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local stats_file="$GAUNTLET_DATA_DIR/stats/daily_stats.json"
    local metrics_file="$GAUNTLET_DATA_DIR/metrics/optimization_${timestamp}.json"
    local focus_metrics_file="$GAUNTLET_DATA_DIR/state/focus_metrics.json"
    local temp_file=$(mktemp)
    
    # Ensure stats file exists with valid JSON
    if [[ ! -f "$stats_file" ]]; then
        echo "{}" > "$stats_file"
    fi
    
    # Get today's date
    local today=$(date +%Y-%m-%d)
    
    # Read current stats
    local current_stats
    if ! current_stats=$(jq -r ".[\"$today\"] // {}" "$stats_file" 2>/dev/null); then
        current_stats="{}"
    fi
    
    # Get system metrics safely
    local cpu_usage=$(ensure_numeric "$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' || echo "0")")
    local mem_total=$(ensure_numeric "$(free | grep Mem | awk '{print $2}')")
    local mem_used=$(ensure_numeric "$(free | grep Mem | awk '{print $3}')")
    local swap_total=$(ensure_numeric "$(free | grep Swap | awk '{print $2}')")
    local swap_used=$(ensure_numeric "$(free | grep Swap | awk '{print $3}')")
    local disk_usage=$(ensure_numeric "$(df -h / | tail -1 | awk '{print $5}' | tr -d '%' || echo "0")")
    
    local mem_usage=$(ensure_numeric "$(calc_percentage "$mem_used" "$mem_total")")
    local swap_usage=$(ensure_numeric "$(calc_percentage "$swap_used" "$swap_total")")
    
    # Create metrics JSON
    if ! create_json_metrics "$cpu_usage" "$mem_usage" "$swap_usage" "$disk_usage" "$current_stats" "$focus_metrics_file" > "$temp_file" 2>/dev/null; then
        log "Error: Failed to create JSON metrics"
        rm -f "$temp_file"
        return 1
    fi

    # Move JSON to final location
    mv "$temp_file" "$metrics_file"
    log "Optimized gauntlet metrics to $metrics_file"

    # Apply optimizations based on metrics
    if [[ $(jq -r '.system_metrics.memory_usage' "$metrics_file") -gt 80 ]]; then
        log "High memory usage detected, triggering cleanup"
        find "$GAUNTLET_DATA_DIR/stats" -type f -name "*.json" -mtime +7 -delete
    fi

    if [[ $(jq -r '.system_metrics.swap_usage' "$metrics_file") -gt 50 ]]; then
        log "High swap usage detected, adjusting memory limits"
        systemctl --user set-property cursor-context.slice MemoryHigh=2G
    fi
}

# Main loop
while true; do
    if optimize_gauntlet; then
        notify_watchdog
    else
        log "Failed to optimize gauntlet metrics"
    fi
    sleep 300  # Run every 5 minutes
done 