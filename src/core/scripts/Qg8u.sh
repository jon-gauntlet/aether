#!/bin/bash

# Common Utilities Library
# Shared functions and utilities for the AI system evolution

# Configuration
BACKUP_DIR="/home/jon/.local/state/cursor/backups"
STATE_DIR="/home/jon/.local/state/cursor/state"
LOG_DIR="/home/jon/.local/state/cursor/logs"

# Ensure directories exist
mkdir -p "$BACKUP_DIR" "$STATE_DIR" "$LOG_DIR"

# Logging with timestamps and levels
log_common() {
    local level="$1"
    shift
    echo "[$(date -Iseconds)] [$level] $*" >> "$LOG_DIR/common.log"
}

# Error handling
handle_error() {
    local error_msg="$1"
    local error_code="${2:-1}"
    log_common "ERROR" "$error_msg"
    return "$error_code"
}

# State management
backup_state() {
    local backup_name="${1:-$(date +%Y%m%d_%H%M%S)}"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log_common "INFO" "Creating state backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup configuration
    cp -r "/home/jon/.config/cursor" "$backup_path/config"
    
    # Backup state
    cp -r "/home/jon/.local/state/cursor" "$backup_path/state"
    
    # Create metadata
    echo '{
        "timestamp": "'$(date -Iseconds)'",
        "type": "full",
        "services": [
            "context-crystallizer",
            "essence-integrator",
            "autonomic-manager"
        ]
    }' > "$backup_path/metadata.json"
    
    # Create checksum
    find "$backup_path" -type f -exec sha256sum {} \; > "$backup_path/checksums.txt"
    
    log_common "INFO" "State backup completed: $backup_name"
    return 0
}

restore_state() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        handle_error "Backup not found: $backup_name"
        return 1
    fi
    
    log_common "INFO" "Restoring state from backup: $backup_name"
    
    # Verify checksums
    if ! (cd "$backup_path" && sha256sum -c checksums.txt); then
        handle_error "Backup integrity check failed"
        return 1
    fi
    
    # Stop services
    systemctl --user stop context-crystallizer.service essence-integrator.service autonomic-manager.service
    
    # Restore configuration
    rsync -a "$backup_path/config/" "/home/jon/.config/cursor/"
    
    # Restore state
    rsync -a "$backup_path/state/" "/home/jon/.local/state/cursor/"
    
    # Restart services
    systemctl --user start context-crystallizer.service essence-integrator.service autonomic-manager.service
    
    log_common "INFO" "State restore completed: $backup_name"
    return 0
}

# Validation functions
validate_evolution() {
    local status=0
    
    log_common "INFO" "Validating system evolution"
    
    # Check service status
    for service in context-crystallizer essence-integrator autonomic-manager; do
        if ! systemctl --user is-active "$service" >/dev/null 2>&1; then
            handle_error "Service validation failed: $service"
            status=1
        fi
    done
    
    # Check resource usage
    local cpu_usage mem_usage
    cpu_usage=$(get_average_usage "cpu" 1)
    mem_usage=$(get_average_usage "memory" 1)
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        handle_error "CPU usage too high: ${cpu_usage}%"
        status=1
    fi
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        handle_error "Memory usage too high: ${mem_usage}%"
        status=1
    fi
    
    # Check pattern database
    if ! validate_patterns; then
        handle_error "Pattern validation failed"
        status=1
    fi
    
    return "$status"
}

validate_patterns() {
    local pattern_db="/home/jon/.local/share/cursor/patterns/db.json"
    
    if [[ ! -f "$pattern_db" ]]; then
        handle_error "Pattern database not found"
        return 1
    fi
    
    # Validate JSON structure
    if ! jq empty "$pattern_db" >/dev/null 2>&1; then
        handle_error "Invalid pattern database format"
        return 1
    fi
    
    # Check pattern confidence
    local low_confidence
    low_confidence=$(jq '[.patterns[] | select(.confidence < 0.5)] | length' "$pattern_db")
    
    if (( low_confidence > 0 )); then
        handle_error "Found $low_confidence patterns with low confidence"
        return 1
    fi
    
    return 0
}

# Task execution
execute_step() {
    local step="$1"
    local status=0
    
    log_common "INFO" "Executing step: $step"
    
    case "$step" in
        "optimize_patterns")
            optimize_patterns || status=$?
            ;;
        "enhance_context")
            enhance_context || status=$?
            ;;
        "update_models")
            update_models || status=$?
            ;;
        "improve_integration")
            improve_integration || status=$?
            ;;
        *)
            handle_error "Unknown step: $step"
            status=1
            ;;
    esac
    
    if (( status != 0 )); then
        handle_error "Step failed: $step"
        return 1
    fi
    
    log_common "INFO" "Step completed successfully: $step"
    return 0
}

# Pattern functions
get_pattern_confidence() {
    local pattern_type="$1"
    local pattern_db="/home/jon/.local/share/cursor/patterns/db.json"
    
    if [[ ! -f "$pattern_db" ]]; then
        echo "0"
        return
    fi
    
    jq --arg type "$pattern_type" '
    [.patterns[] | select(.type == $type) | .confidence] |
    if length > 0 then
        (add / length)
    else
        0
    end' "$pattern_db"
}

optimize_patterns() {
    local pattern_db="/home/jon/.local/share/cursor/patterns/db.json"
    local temp_file
    temp_file=$(mktemp)
    
    log_common "INFO" "Optimizing patterns"
    
    # Remove low confidence patterns
    jq '.patterns |= map(select(.confidence >= 0.5))' "$pattern_db" > "$temp_file"
    
    # Merge similar patterns
    jq '
    def similarity($a; $b):
        ($a.type == $b.type and $a.context == $b.context);
    
    .patterns |= reduce .[] as $item ([];
        if any(.[]; similarity(.; $item)) then
            map(if similarity(.; $item)
                then . + {
                    confidence: ((.confidence + $item.confidence) / 2),
                    last_seen: [$item.last_seen, .last_seen] | max
                }
                else .
                end)
        else
            . + [$item]
        end
    )' "$temp_file" > "${temp_file}.2" && mv "${temp_file}.2" "$temp_file"
    
    # Update pattern database
    mv "$temp_file" "$pattern_db"
    
    return 0
}

# Utility functions
get_timestamp() {
    date -Iseconds
}

is_valid_json() {
    local file="$1"
    jq empty "$file" >/dev/null 2>&1
}

create_directory() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
    fi
}

cleanup_temp_files() {
    find /tmp -name "evolution_*" -mtime +1 -delete
}

# Set up cleanup on exit
cleanup_common() {
    cleanup_temp_files
}

trap cleanup_common EXIT 