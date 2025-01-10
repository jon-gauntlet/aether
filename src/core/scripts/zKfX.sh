#!/bin/bash

# Enhanced Autonomic Manager for Cursor System
# Implements IBM's MAPE-K loop (Monitor, Analyze, Plan, Execute, Knowledge)
# Integrates self-* properties: configuration, healing, optimization, protection

set -euo pipefail

# Check for required dependencies
for cmd in jq systemctl curl sha256sum; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: Required command '$cmd' not found" >&2
        exit 1
    fi
done

# Configuration
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
AUTONOMIC_STATE="$CURSOR_STATE_DIR/autonomic"
KNOWLEDGE_BASE="$AUTONOMIC_STATE/knowledge.json"
HEALTH_METRICS="$AUTONOMIC_STATE/health_metrics.json"
PATTERN_DB="$AUTONOMIC_STATE/patterns/pattern_database.json"

# Create required directories
mkdir -p "$AUTONOMIC_STATE"/{knowledge,metrics,patterns,models,state}

# Initialize knowledge base if needed
if [ ! -f "$KNOWLEDGE_BASE" ]; then
    echo '{
        "services": {
            "context-crystallizer": {"health": 100, "incidents": 0, "last_optimization": 0},
            "essence-integrator": {"health": 100, "incidents": 0, "last_optimization": 0}
        },
        "patterns": [],
        "thresholds": {
            "cpu_high": 80,
            "memory_high": 85,
            "restart_threshold": 3,
            "incident_window": 3600,
            "pattern_confidence": 0.75,
            "learning_rate": 0.1
        },
        "state": {
            "mode": "learning",
            "adaptation_level": 1,
            "last_backup": 0
        }
    }' > "$KNOWLEDGE_BASE"
fi

# Initialize pattern database if needed
if [ ! -f "$PATTERN_DB" ]; then
    echo '{
        "service_patterns": [],
        "resource_patterns": [],
        "interaction_patterns": [],
        "anomaly_patterns": [],
        "meta": {
            "version": 1,
            "last_update": 0,
            "pattern_count": 0
        }
    }' > "$PATTERN_DB"
fi

# Logging with severity levels
log() {
    local level=$1
    shift
    echo "[$(date -Iseconds)] [$level] $*" >&2
}

# Self-Configuration: Automatic service configuration
configure_service() {
    local service=$1
    local config_type=$2
    local knowledge
    
    knowledge=$(cat "$KNOWLEDGE_BASE")
    local adaptation_level=$(echo "$knowledge" | jq -r '.state.adaptation_level')
    
    case "$config_type" in
        "performance")
            # Adjust service configuration based on adaptation level
            local mem_limit=$((2 + adaptation_level))
            local cpu_quota=$((20 + adaptation_level * 5))
            
            systemctl --user set-property "$service.service" \
                MemoryHigh="${mem_limit}G" \
                CPUQuota="${cpu_quota}%" \
                IOWeight=$((40 + adaptation_level * 5))
            ;;
        "protection")
            # Configure protection mechanisms
            systemctl --user set-property "$service.service" \
                MemoryMax="${mem_limit}G" \
                TasksMax=$((32 + adaptation_level * 4)) \
                RestartSec=$((1 + adaptation_level))
            ;;
    esac
}

# Self-Healing: Enhanced incident handling
handle_incident() {
    local service=$1
    local incident_type=$2
    local knowledge
    
    knowledge=$(cat "$KNOWLEDGE_BASE")
    
    # Update incident count and health score
    knowledge=$(echo "$knowledge" | jq --arg svc "$service" \
        --arg type "$incident_type" '
        .services[$svc].incidents += 1 |
        .services[$svc].health = ([.services[$svc].health - 10, 0] | max) |
        .services[$svc].last_incident = now
    ')
    
    case "$incident_type" in
        "service_down")
            log "ERROR" "Service $service is down, initiating recovery"
            backup_service_state "$service"
            systemctl --user restart "$service.service"
            verify_service_health "$service"
            ;;
        "high_cpu"|"high_memory")
            log "WARN" "Resource pressure in $service, optimizing"
            optimize_service "$service" "$incident_type"
            ;;
        "anomaly")
            log "WARN" "Anomaly detected in $service, analyzing patterns"
            analyze_anomaly "$service"
            ;;
    esac
    
    # Update knowledge base
    echo "$knowledge" > "$KNOWLEDGE_BASE"
}

# Self-Optimization: Enhanced service optimization
optimize_service() {
    local service=$1
    local trigger=$2
    local knowledge
    
    knowledge=$(cat "$KNOWLEDGE_BASE")
    local last_opt=$(echo "$knowledge" | jq -r ".services[\"$service\"].last_optimization")
    local now=$(date +%s)
    
    # Prevent too frequent optimizations
    if (( now - last_opt < 300 )); then
        log "INFO" "Skipping optimization, too soon since last attempt"
        return
    fi
    
    case "$service" in
        "context-crystallizer")
            if [[ -f "$CURSOR_STATE_DIR/active_context.json" ]]; then
                log "INFO" "Optimizing context crystallizer"
                echo '{
                    "command": "optimize",
                    "parameters": {
                        "aggressive": true,
                        "preserve_patterns": true
                    }
                }' > "$CURSOR_STATE_DIR/commands.json"
                
                # Adjust resource limits
                configure_service "$service" "performance"
            fi
            ;;
        "essence-integrator")
            if [[ -d "$CURSOR_CONFIG_DIR/contexts" ]]; then
                log "INFO" "Optimizing essence integrator"
                echo '{
                    "command": "optimize_knowledge",
                    "parameters": {
                        "depth": "deep",
                        "preserve_sacred": true
                    }
                }' > "$CURSOR_STATE_DIR/optimize_essence.json"
                
                # Adjust resource limits
                configure_service "$service" "performance"
            fi
            ;;
    esac
    
    # Update optimization timestamp
    knowledge=$(echo "$knowledge" | jq --arg svc "$service" \
        --arg now "$now" '.services[$svc].last_optimization = ($now | tonumber)')
    echo "$knowledge" > "$KNOWLEDGE_BASE"
}

# Self-Protection: Security and integrity checks
protect_service() {
    local service=$1
    local knowledge
    
    knowledge=$(cat "$KNOWLEDGE_BASE")
    
    # Verify service integrity
    local service_hash=$(sha256sum "$HOME/scripts/cursor/$service" | cut -d' ' -f1)
    local stored_hash=$(echo "$knowledge" | jq -r ".services[\"$service\"].hash")
    
    if [[ -n "$stored_hash" ]] && [[ "$service_hash" != "$stored_hash" ]]; then
        log "ERROR" "Service integrity violation detected for $service"
        handle_incident "$service" "integrity_violation"
        return 1
    fi
    
    # Update service hash
    knowledge=$(echo "$knowledge" | jq --arg svc "$service" \
        --arg hash "$service_hash" '.services[$svc].hash = $hash')
    echo "$knowledge" > "$KNOWLEDGE_BASE"
    
    # Configure protection mechanisms
    configure_service "$service" "protection"
    
    return 0
}

# Self-Learning: Enhanced pattern recognition
learn_patterns() {
    local metrics=$1
    local knowledge
    
    knowledge=$(cat "$KNOWLEDGE_BASE")
    local learning_rate=$(echo "$knowledge" | jq -r '.thresholds.learning_rate')
    local pattern_db=$(cat "$PATTERN_DB")
    
    # Extract new patterns
    local new_patterns=$(echo "$metrics" | jq --arg lr "$learning_rate" '
        . as $root |
        reduce (.[] | objects) as $obj ([];
            . + [{
                "type": "resource",
                "metrics": $obj,
                "timestamp": now,
                "confidence": ($obj.frequency // 1) * ($lr | tonumber)
            }]
        )')
    
    # Update pattern database
    pattern_db=$(echo "$pattern_db" | jq --argjson patterns "$new_patterns" '
        .service_patterns = (.service_patterns + $patterns | 
            sort_by(.confidence) | reverse | .[0:100]
        ) |
        .meta.pattern_count = .service_patterns | length |
        .meta.last_update = now
    ')
    
    echo "$pattern_db" > "$PATTERN_DB"
}

# Monitor: Enhanced metrics collection
monitor_services() {
    local service_metrics="{}"
    
    for service in context-crystallizer essence-integrator; do
        # Get comprehensive service metrics
        local status=$(systemctl --user show "$service.service" \
            --property=ActiveState,SubState,NRestarts,CPUUsageNSec,MemoryCurrent)
        local pressure=$(cat /proc/pressure/cpu 2>/dev/null || echo "some avg10=0.00")
        
        service_metrics=$(echo "$service_metrics" | jq --arg svc "$service" \
            --arg status "$status" \
            --arg pressure "$pressure" \
            '. + {($svc): {
                "status": $status,
                "pressure": $pressure,
                "timestamp": now,
                "frequency": 1
            }}')
    done
    
    echo "$service_metrics" > "$HEALTH_METRICS"
    learn_patterns "$service_metrics"
}

# Analyze: Enhanced health analysis
analyze_health() {
    local metrics
    metrics=$(cat "$HEALTH_METRICS")
    local knowledge=$(cat "$KNOWLEDGE_BASE")
    local pattern_db=$(cat "$PATTERN_DB")
    
    for service in context-crystallizer essence-integrator; do
        # Verify service integrity
        protect_service "$service" || continue
        
        # Check service health
        if ! systemctl --user is-active "$service.service" >/dev/null 2>&1; then
            handle_incident "$service" "service_down"
            continue
        fi
        
        # Analyze metrics against known patterns
        local anomaly=$(echo "$metrics" | jq --arg svc "$service" \
            --argjson patterns "$(echo "$pattern_db" | jq '.service_patterns')" \
            --arg conf "$(echo "$knowledge" | jq -r '.thresholds.pattern_confidence')" '
            . as $root |
            $patterns | map(select(
                .confidence >= ($conf | tonumber) and
                .metrics[$svc].pressure > $root[$svc].pressure
            )) | length > 0
        ')
        
        if [[ "$anomaly" == "true" ]]; then
            handle_incident "$service" "anomaly"
        fi
        
        # Check resource usage
        analyze_resources "$service" "$metrics"
    done
}

# Main loop implementing MAPE-K
log "INFO" "Starting Enhanced Autonomic Manager"

while true; do
    # Monitor
    monitor_services
    
    # Analyze
    analyze_health
    
    # Sleep with adaptive interval based on system state
    knowledge=$(cat "$KNOWLEDGE_BASE")
    mode=$(echo "$knowledge" | jq -r '.state.mode')
    
    case "$mode" in
        "learning")
            sleep 30
            ;;
        "optimizing")
            sleep 15
            ;;
        *)
            sleep 60
            ;;
    esac
done 