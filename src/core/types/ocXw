#!/bin/bash

set -euo pipefail

# Environment setup
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
ESSENCE_RESOURCES_DIR="${ESSENCE_RESOURCES_DIR:-$HOME/.config/cursor/contexts}"

# Ensure directories exist
mkdir -p "$CURSOR_STATE_DIR/contexts" "$CURSOR_DATA_DIR/crystallized"

# Logging function
log() {
    echo "[$(date -Iseconds)] $*"
}

# Notify systemd watchdog
notify_watchdog() {
    echo "WATCHDOG=1"
}

# Crystallize current session context
crystallize_session() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local session_file="$CURSOR_DATA_DIR/crystallized/session_${timestamp}.json"
    local temp_file=$(mktemp)
    
    # Collect current session data
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"workspace\": \"/\","
        echo "  \"active_services\": ["
        systemctl --user list-units --type=service --state=active --no-legend | \
            awk '{gsub(/["\\]/, "\\\\&"); print "    \"" $1 "\","}' | \
            sed '$s/,$//'
        echo "  ],"
        echo "  \"context_paths\": ["
        find "$CURSOR_CONFIG_DIR/contexts" -type f -name "*.md" | \
            while IFS= read -r file; do
                printf '    "%s",\n' "$(echo "$file" | sed 's/["\]/\\&/g')"
            done | sed '$s/,$//'
        echo "  ],"
        echo "  \"active_contexts\": ["
        find "$CURSOR_CONFIG_DIR/contexts" -type f -name "*.md" -mmin -30 | \
            while IFS= read -r file; do
                printf '    "%s",\n' "$(echo "$file" | sed 's/["\]/\\&/g')"
            done | sed '$s/,$//'
        echo "  ]"
        echo "}"
    } > "$temp_file"

    # Validate JSON before moving to final location
    if jq . "$temp_file" >/dev/null 2>&1; then
        mv "$temp_file" "$session_file"
        log "Crystallized session to $session_file"
    else
        log "Error: Invalid JSON generated"
        rm "$temp_file"
    fi
}

# Main loop
while true; do
    crystallize_session
    notify_watchdog
    sleep 30
done 