#!/bin/bash

# AI System Evolution Service
# Main service script that manages the evolution of the AI system

set -euo pipefail

# Configuration
EVOLUTION_ROOT="${EVOLUTION_ROOT:-/home/jon/ai_system_evolution}"
CONFIG_DIR="$EVOLUTION_ROOT/config"
DATA_DIR="$EVOLUTION_ROOT/data"
LIB_DIR="$EVOLUTION_ROOT/lib"
LOG_DIR="/home/jon/.local/state/cursor/logs"

# Ensure directories exist
mkdir -p "$DATA_DIR"/{models,patterns,metrics}
mkdir -p "$LOG_DIR"

# Source libraries
source "$LIB_DIR/common.sh"
source "$LIB_DIR/resource.sh"
source "$LIB_DIR/monitor.sh"

# Systemd integration
NOTIFY_SOCKET="${NOTIFY_SOCKET:-}"
watchdog_usec=0

if [[ -n "$NOTIFY_SOCKET" ]]; then
    # Get configured watchdog interval
    if systemctl --user show-environment | grep -q ^WATCHDOG_USEC=; then
        watchdog_usec=$(systemctl --user show-environment | grep ^WATCHDOG_USEC= | cut -d= -f2)
    fi
fi

notify_systemd() {
    if [[ -n "$NOTIFY_SOCKET" ]]; then
        systemd-notify "$@"
    fi
}

watchdog_ping() {
    if [[ $watchdog_usec -gt 0 ]]; then
        notify_systemd WATCHDOG=1
    fi
}

# Logging
log() {
    local level="$1"
    shift
    echo "[$(date -Iseconds)] [$level] $*" | tee -a "$LOG_DIR/evolution.log"
}

# Resource check
check_resources() {
    local cpu_usage=$(get_cpu_usage)
    local mem_usage=$(get_memory_usage)
    local cpu_limit=$(get_config_value "resource_limits.cpu_max")
    local mem_limit=$(get_config_value "resource_limits.memory_max")
    
    [[ "$cpu_usage" -lt "$cpu_limit" && "$mem_usage" -lt "$mem_limit" ]]
}

# Task scheduling
can_run_task() {
    local task="$1"
    local priority=$(get_task_priority "$task")
    
    # Check system load
    if ! check_resources; then
        return 1
    fi
    
    # Check if within active hours
    if ! within_active_hours; then
        return 1
    fi
    
    return 0
}

# Evolution steps
evolve_system() {
    # Only proceed if resources allow
    if ! can_run_task "evolution"; then
        log "INFO" "Skipping evolution, system busy or outside active hours"
        return 0
    fi
    
    # Backup current state
    if ! backup_state; then
        log "ERROR" "Failed to backup state, aborting evolution"
        return 1
    fi
    
    # Attempt evolution steps
    local steps=(
        "optimize_patterns"
        "enhance_context"
        "update_models"
        "improve_integration"
    )
    
    for step in "${steps[@]}"; do
        if can_run_task "$step"; then
            log "INFO" "Executing evolution step: $step"
            if ! execute_step "$step"; then
                log "ERROR" "Failed to execute step: $step"
                restore_state
                return 1
            fi
            watchdog_ping
        fi
    done
    
    # Validate changes
    if ! validate_evolution; then
        log "ERROR" "Evolution validation failed, rolling back"
        restore_state
        return 1
    fi
    
    log "INFO" "Evolution cycle completed successfully"
    return 0
}

# Main loop
main() {
    log "INFO" "Starting AI System Evolution Service"
    
    # Initialize systems
    initialize_monitoring
    initialize_resource_tracking
    
    # Notify systemd we're ready
    notify_systemd READY=1
    
    # Calculate watchdog interval (half of systemd's interval)
    watchdog_interval=30
    if [[ $watchdog_usec -gt 0 ]]; then
        watchdog_interval=$((watchdog_usec / 2000000))
    fi
    
    # Main service loop
    while true; do
        evolve_system
        watchdog_ping
        
        # Adaptive sleep based on system state
        sleep_duration=$(calculate_sleep_duration)
        if [[ $sleep_duration -gt $watchdog_interval ]]; then
            sleep_duration=$watchdog_interval
        fi
        sleep "$sleep_duration"
    done
}

# Start the service
main 