#!/bin/bash

set -euo pipefail

# Environment setup
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
ESSENCE_RESOURCES_DIR="${ESSENCE_RESOURCES_DIR:-$HOME/.config/cursor/contexts}"

# Ensure directories exist
mkdir -p "$CURSOR_STATE_DIR/contexts" "$CURSOR_DATA_DIR/optimized"

# Logging function
log() {
    echo "[$(date -Iseconds)] $*"
}

# Notify systemd watchdog
notify_watchdog() {
    echo "WATCHDOG=1"
}

# JSON escape function
json_escape() {
    printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

# Optimize context storage
optimize_contexts() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Clean old crystallized sessions (keep last 24 hours)
    find "$CURSOR_DATA_DIR/crystallized" -type f -name "session_*.json" -mtime +1 -delete
    
    # Merge active contexts
    local merged_file="$CURSOR_DATA_DIR/optimized/contexts_${timestamp}.json"
    local temp_file=$(mktemp)
    
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"active_contexts\": ["
        find "$CURSOR_DATA_DIR/crystallized" -type f -name "session_*.json" -mmin -30 -exec jq -r '.active_contexts[]' {} \; 2>/dev/null | \
            sort -u | \
            while IFS= read -r context; do
                [[ -n "$context" ]] && echo "    $(json_escape "$context"),"
            done | sed '$s/,$//'
        echo "  ],"
        echo "  \"context_stats\": {"
        find "$CURSOR_CONFIG_DIR/contexts" -type f -name "*.md" | \
            while IFS= read -r file; do
                local accesses=$(find "$CURSOR_DATA_DIR/crystallized" -type f -name "session_*.json" -mmin -1440 -exec grep -l "$file" {} \; 2>/dev/null | wc -l)
                echo "    $(json_escape "$file"): $accesses,"
            done | sed '$s/,$//'
        echo "  }"
        echo "}"
    } > "$temp_file"

    # Validate JSON before moving to final location
    if jq . "$temp_file" >/dev/null 2>&1; then
        mv "$temp_file" "$merged_file"
        log "Optimized contexts to $merged_file"
    else
        log "Error: Invalid JSON generated"
        cat "$temp_file" | jq . 2>&1 | log
        rm "$temp_file"
    fi
}

# Main loop
while true; do
    optimize_contexts
    notify_watchdog
    sleep 300  # Run every 5 minutes
done 