#!/bin/bash

# Resource Management Library
# Handles system resource monitoring and management

# Configuration
METRICS_FILE="/home/jon/.local/state/cursor/metrics/resources.json"
CONFIG_FILE="/home/jon/ai_system_evolution/config/resources.json"

# Get current CPU usage percentage
get_cpu_usage() {
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    printf "%.0f" "$cpu_usage"
}

# Get current memory usage percentage
get_memory_usage() {
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    printf "%.0f" "$mem_usage"
}

# Get IO wait percentage
get_io_wait() {
    local io_wait
    io_wait=$(top -bn1 | grep "Cpu(s)" | awk '{print $10}')
    printf "%.0f" "$io_wait"
}

# Check if system is idle
is_system_idle() {
    local cpu_usage mem_usage io_wait
    cpu_usage=$(get_cpu_usage)
    mem_usage=$(get_memory_usage)
    io_wait=$(get_io_wait)
    
    [[ "$cpu_usage" -lt 30 && "$mem_usage" -lt 50 && "$io_wait" -lt 5 ]]
}

# Get configuration value
get_config_value() {
    local key="$1"
    jq -r ".$key" "$CONFIG_FILE"
}

# Check if current time is within active hours
within_active_hours() {
    local current_hour=$(date +%-H)
    local start_hour=9
    local end_hour=17

    if [ "$current_hour" -ge "$start_hour" ] && [ "$current_hour" -lt "$end_hour" ]; then
        return 0
    else
        return 1
    fi
}

# Calculate task priority based on system state
get_task_priority() {
    local task="$1"
    local base_priority
    
    case "$task" in
        "evolution")
            base_priority=10
            ;;
        "optimize_patterns")
            base_priority=20
            ;;
        "enhance_context")
            base_priority=30
            ;;
        "update_models")
            base_priority=40
            ;;
        "improve_integration")
            base_priority=50
            ;;
        *)
            base_priority=100
            ;;
    esac
    
    # Adjust priority based on system state
    if is_system_idle; then
        base_priority=$((base_priority - 10))
    fi
    
    echo "$base_priority"
}

# Calculate adaptive sleep duration based on system state
calculate_sleep_duration() {
    local base_duration=300  # 5 minutes
    
    if is_system_idle; then
        base_duration=60  # 1 minute during idle
    elif ! within_active_hours; then
        base_duration=900  # 15 minutes during inactive hours
    fi
    
    echo "$base_duration"
}

# Initialize resource tracking
initialize_resource_tracking() {
    # Ensure metrics file exists
    if [[ ! -f "$METRICS_FILE" ]]; then
        echo '{"cpu": [], "memory": [], "io": []}' > "$METRICS_FILE"
    fi
    
    # Start background resource monitoring
    while true; do
        update_resource_metrics
        sleep 60
    done &
}

# Update resource metrics
update_resource_metrics() {
    local cpu_usage mem_usage io_wait timestamp
    cpu_usage=$(get_cpu_usage)
    mem_usage=$(get_memory_usage)
    io_wait=$(get_io_wait)
    timestamp=$(date -Iseconds)
    
    # Update metrics file
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg cpu "$cpu_usage" \
       --arg mem "$mem_usage" \
       --arg io "$io_wait" \
       --arg ts "$timestamp" '
    {
        "cpu": (.cpu + [{
            "value": ($cpu | tonumber),
            "timestamp": $ts
        }])[-100:],
        "memory": (.memory + [{
            "value": ($mem | tonumber),
            "timestamp": $ts
        }])[-100:],
        "io": (.io + [{
            "value": ($io | tonumber),
            "timestamp": $ts
        }])[-100:]
    }' "$METRICS_FILE" > "$temp_file" && mv "$temp_file" "$METRICS_FILE"
}

# Get average resource usage over the last n minutes
get_average_usage() {
    local resource="$1"
    local minutes="${2:-5}"
    local cutoff
    cutoff=$(date -d "$minutes minutes ago" -Iseconds)
    
    jq --arg cutoff "$cutoff" \
       --arg resource "$resource" \
       '
    .[$resource][] |
    select(.timestamp >= $cutoff) |
    .value
    ' "$METRICS_FILE" | awk '{ sum += $1 } END { if (NR > 0) print sum/NR; else print 0 }'
}

# Check if resources are available for a specific operation
can_allocate_resources() {
    local cpu_required="$1"
    local mem_required="$2"
    
    local cpu_available mem_available
    cpu_available=$((100 - $(get_cpu_usage)))
    mem_available=$((100 - $(get_memory_usage)))
    
    [[ "$cpu_available" -ge "$cpu_required" && "$mem_available" -ge "$mem_required" ]]
}

# Cleanup resources on exit
cleanup_resources() {
    # Kill background monitoring
    jobs -p | xargs -r kill
    
    # Final metrics update
    update_resource_metrics
}

# Set up exit trap
trap cleanup_resources EXIT 