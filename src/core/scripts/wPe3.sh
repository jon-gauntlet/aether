#!/bin/bash

# Enhanced Context Crystallizer for Dual-Claude Setup
# Handles both Project and System Claude contexts

CURSOR_CONFIG="/home/jon/.config/cursor"
CURSOR_SHARE="/home/jon/.local/share/cursor"
LOG_FILE="$CURSOR_SHARE/logs/context_crystallizer.log"

# Context Directories
PROJECT_CONTEXT_DIR="$CURSOR_SHARE/contexts/project"
SYSTEM_CONTEXT_DIR="$CURSOR_SHARE/contexts/system"
SACRED_CONTEXT_DIR="$CURSOR_SHARE/contexts/.sacred"

# Ensure directories exist
mkdir -p "$PROJECT_CONTEXT_DIR" "$SYSTEM_CONTEXT_DIR" "$SACRED_CONTEXT_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

crystallize_context() {
    local context_type="$1"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local context_dir
    local slice_name
    
    case "$context_type" in
        "project")
            context_dir="$PROJECT_CONTEXT_DIR"
            slice_name="cursor-claude-project.slice"
            ;;
        "system")
            context_dir="$SYSTEM_CONTEXT_DIR"
            slice_name="cursor-claude-system.slice"
            ;;
        *)
            log "Invalid context type: $context_type"
            return 1
            ;;
    esac
    
    # Backup current context
    if [[ -f "$context_dir/current_context.json" ]]; then
        cp "$context_dir/current_context.json" "$context_dir/backup_${timestamp}.json"
        log "Backed up $context_type context"
    fi
    
    # Create new context
    cat > "$context_dir/current_context.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "type": "$context_type",
    "workspace": "$(pwd)",
    "context_depth": 0,
    "flow_state": "active",
    "tool_calls": 0,
    "slice": "$slice_name",
    "sacred_principles": $(cat "$SACRED_CONTEXT_DIR/principles.json" 2>/dev/null || echo '{}'),
    "patterns": $(cat "$CURSOR_CONFIG/contexts/patterns/recognition.json" 2>/dev/null || echo '{}')
}
EOF
    
    log "Crystallized new $context_type context"
    
    # Cleanup old backups (keep last 5)
    ls -t "$context_dir"/backup_*.json 2>/dev/null | tail -n +6 | xargs -r rm
    log "Cleaned up old $context_type backups"
    
    # Restart associated slice if it exists
    if systemctl --user is-active "$slice_name" >/dev/null 2>&1; then
        systemctl --user restart "$slice_name"
        log "Restarted $slice_name"
    fi
}

optimize_composer() {
    local context_type="$1"
    local slice_name
    
    case "$context_type" in
        "project")
            slice_name="cursor-claude-project.slice"
            ;;
        "system")
            slice_name="cursor-claude-system.slice"
            ;;
        *)
            return 1
            ;;
    esac
    
    # Set resource limits
    if [[ -f "/home/jon/.config/systemd/user/$slice_name" ]]; then
        systemctl --user restart "$slice_name"
        log "Optimized resources for $context_type Claude"
    fi
}

check_context_health() {
    local context_type="$1"
    local context_dir
    
    case "$context_type" in
        "project")
            context_dir="$PROJECT_CONTEXT_DIR"
            ;;
        "system")
            context_dir="$SYSTEM_CONTEXT_DIR"
            ;;
        *)
            return 1
            ;;
    esac
    
    local current_context="$context_dir/current_context.json"
    
    if [[ -f "$current_context" ]]; then
        local context_depth=$(jq -r '.context_depth' "$current_context")
        local tool_calls=$(jq -r '.tool_calls' "$current_context")
        
        # Check if context needs crystallization
        if [[ "$context_depth" -gt 75 ]] || [[ "$tool_calls" -gt 20 ]]; then
            log "$context_type context needs crystallization"
            return 1
        fi
    fi
    
    return 0
}

# Main execution
context_type="${1:-project}"  # Default to project context

log "Starting context management for $context_type Claude"

if ! check_context_health "$context_type"; then
    crystallize_context "$context_type"
    optimize_composer "$context_type"
fi

log "Completed context management for $context_type Claude" 