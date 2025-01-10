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
    
    # Collect current session data
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"workspace\": \"$(pwd)\","
        echo "  \"active_services\": ["
        systemctl --user list-units --type=service --state=active --no-legend | awk '{print "    \"" $1 "\","}'
        echo "    null"
        echo "  ],"
        echo "  \"context_paths\": ["
        find "$CURSOR_CONFIG_DIR/contexts" -type f -name "*.md" -printf '    "%p",\n'
        echo "    null"
        echo "  ]"
        echo "}"
    } > "$session_file"

    log "Crystallized session to $session_file"
}

# Main loop
while true; do
    crystallize_session
    notify_watchdog
    sleep 30
done 