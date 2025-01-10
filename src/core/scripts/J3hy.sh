#!/bin/bash

# System Monitoring Library
# Handles system monitoring, health checks, and alerting

# Configuration
MONITOR_DIR="/home/jon/.local/state/cursor/monitor"
HEALTH_FILE="$MONITOR_DIR/health.json"
ALERT_FILE="$MONITOR_DIR/alerts.json"
LOG_FILE="/home/jon/.local/state/cursor/logs/monitor.log"

# Ensure directories exist
mkdir -p "$MONITOR_DIR"

# Initialize health file if needed
if [[ ! -f "$HEALTH_FILE" ]]; then
    echo '{
        "services": {},
        "resources": {},
        "patterns": {},
        "last_check": null,
        "status": "unknown"
    }' > "$HEALTH_FILE"
fi

# Initialize alerts file if needed
if [[ ! -f "$ALERT_FILE" ]]; then
    echo '{
        "alerts": [],
        "acknowledged": [],
        "resolved": []
    }' > "$ALERT_FILE"
fi

# Logging
log_monitor() {
    local level="$1"
    shift
    echo "[$(date -Iseconds)] [$level] $*" >> "$LOG_FILE"
}

# Health check functions
check_service_health() {
    local service="$1"
    local status
    
    # Check if service is running
    if systemctl --user is-active "$service" >/dev/null 2>&1; then
        status="healthy"
    else
        status="unhealthy"
        create_alert "service_down" "Service $service is not running" "high"
    fi
    
    # Update health file
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg svc "$service" \
       --arg status "$status" \
       --arg ts "$(date -Iseconds)" \
       '.services[$svc] = {
           "status": $status,
           "last_check": $ts
       }' "$HEALTH_FILE" > "$temp_file" && mv "$temp_file" "$HEALTH_FILE"
}

check_resource_health() {
    local resource="$1"
    local current_usage threshold status
    
    current_usage=$(get_average_usage "$resource" 5)
    threshold=$(get_config_value "thresholds.${resource}_high")
    
    if (( $(echo "$current_usage < $threshold" | bc -l) )); then
        status="healthy"
    else
        status="warning"
        create_alert "high_${resource}" "${resource} usage above threshold: ${current_usage}%" "medium"
    fi
    
    # Update health file
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg res "$resource" \
       --arg status "$status" \
       --arg usage "$current_usage" \
       --arg ts "$(date -Iseconds)" \
       '.resources[$res] = {
           "status": $status,
           "usage": ($usage | tonumber),
           "last_check": $ts
       }' "$HEALTH_FILE" > "$temp_file" && mv "$temp_file" "$HEALTH_FILE"
}

check_pattern_health() {
    local pattern_type="$1"
    local confidence threshold status
    
    confidence=$(get_pattern_confidence "$pattern_type")
    threshold=$(get_config_value "thresholds.pattern_confidence")
    
    if (( $(echo "$confidence >= $threshold" | bc -l) )); then
        status="healthy"
    else
        status="degraded"
        create_alert "low_confidence" "Pattern confidence below threshold: ${confidence}" "low"
    fi
    
    # Update health file
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg type "$pattern_type" \
       --arg status "$status" \
       --arg conf "$confidence" \
       --arg ts "$(date -Iseconds)" \
       '.patterns[$type] = {
           "status": $status,
           "confidence": ($conf | tonumber),
           "last_check": $ts
       }' "$HEALTH_FILE" > "$temp_file" && mv "$temp_file" "$HEALTH_FILE"
}

# Alert management
create_alert() {
    local type="$1"
    local message="$2"
    local severity="$3"
    local timestamp
    timestamp=$(date -Iseconds)
    
    # Add alert to file
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg type "$type" \
       --arg msg "$message" \
       --arg sev "$severity" \
       --arg ts "$timestamp" \
       '.alerts += [{
           "type": $type,
           "message": $msg,
           "severity": $sev,
           "timestamp": $ts,
           "id": (now | tostring)
       }]' "$ALERT_FILE" > "$temp_file" && mv "$temp_file" "$ALERT_FILE"
    
    log_monitor "ALERT" "[$severity] $message"
}

acknowledge_alert() {
    local alert_id="$1"
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg id "$alert_id" '
    .acknowledged += [
        (.alerts[] | select(.id == $id))
    ] |
    .alerts -= [
        .alerts[] | select(.id == $id)
    ]' "$ALERT_FILE" > "$temp_file" && mv "$temp_file" "$ALERT_FILE"
}

resolve_alert() {
    local alert_id="$1"
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg id "$alert_id" \
       --arg ts "$(date -Iseconds)" '
    .resolved += [
        (.alerts[] | select(.id == $id) + {"resolved_at": $ts})
    ] |
    .alerts -= [
        .alerts[] | select(.id == $id)
    ]' "$ALERT_FILE" > "$temp_file" && mv "$temp_file" "$ALERT_FILE"
}

# Get overall system health status
get_system_health() {
    local health_data
    health_data=$(cat "$HEALTH_FILE")
    
    # Check if any service is unhealthy
    if echo "$health_data" | jq -e '.services[] | select(.status == "unhealthy")' >/dev/null; then
        echo "unhealthy"
        return
    fi
    
    # Check if any resource is in warning state
    if echo "$health_data" | jq -e '.resources[] | select(.status == "warning")' >/dev/null; then
        echo "warning"
        return
    fi
    
    # Check if any pattern is degraded
    if echo "$health_data" | jq -e '.patterns[] | select(.status == "degraded")' >/dev/null; then
        echo "degraded"
        return
    fi
    
    echo "healthy"
}

# Initialize monitoring
initialize_monitoring() {
    log_monitor "INFO" "Initializing system monitoring"
    
    # Ensure required files exist
    mkdir -p "$MONITOR_DIR"
    touch "$HEALTH_FILE" "$ALERT_FILE"
    
    # Start monitoring loop in background
    while true; do
        # Check services
        check_service_health "context-crystallizer"
        check_service_health "essence-integrator"
        check_service_health "autonomic-manager"
        
        # Check resources
        check_resource_health "cpu"
        check_resource_health "memory"
        check_resource_health "io"
        
        # Check patterns
        check_pattern_health "service"
        check_pattern_health "resource"
        check_pattern_health "integration"
        
        # Update overall status
        local status
        status=$(get_system_health)
        
        jq --arg status "$status" \
           --arg ts "$(date -Iseconds)" \
           '. + {
               "status": $status,
               "last_check": $ts
           }' "$HEALTH_FILE" > "${HEALTH_FILE}.tmp" && mv "${HEALTH_FILE}.tmp" "$HEALTH_FILE"
        
        # Adaptive sleep based on health status
        case "$status" in
            "unhealthy")
                sleep 30  # Check more frequently when unhealthy
                ;;
            "warning"|"degraded")
                sleep 60  # Check every minute when issues detected
                ;;
            *)
                sleep 300  # Normal 5-minute interval
                ;;
        esac
    done &
}

# Cleanup monitoring on exit
cleanup_monitoring() {
    # Kill background monitoring
    jobs -p | xargs -r kill
    
    # Final health check
    check_service_health "context-crystallizer"
    check_service_health "essence-integrator"
    check_service_health "autonomic-manager"
}

# Set up exit trap
trap cleanup_monitoring EXIT 