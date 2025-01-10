#!/bin/bash

# Safe Dual Claude Launcher
# Launches two cursor instances with different contexts without modifying the core binary

set -euo pipefail

# Paths
CURSOR_CONFIG="/home/jon/.config/cursor"
CURSOR_SHARE="/home/jon/.local/share/cursor"
PROJECT_PATH="/home/jon/projects/aether"
AI_SYSTEM_PATH="/home/jon/ai_system_evolution"
LOG_FILE="$CURSOR_SHARE/logs/dual_claude.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Ensure base directories exist
mkdir -p "$CURSOR_SHARE/run" "$CURSOR_CONFIG/contexts" "$(dirname "$LOG_FILE")"

# Activate slices first
log "Activating systemd slices..."
systemctl --user start cursor-claude-{project,system}.slice || {
    log "Failed to activate slices"
    exit 1
}

# Function to launch a cursor instance
launch_cursor() {
    local type="$1"
    local path="$2"
    local pid_file="$CURSOR_SHARE/run/cursor_${type}.pid"
    local log_file="$CURSOR_SHARE/logs/cursor_${type}.log"
    
    log "Launching $type Claude in $path..."
    
    # Launch cursor with nohup and proper redirection
    CURSOR_CONTEXT_TYPE="$type" \
    CURSOR_WORKSPACE="$path" \
    CURSOR_SLICE="cursor-claude-${type}.slice" \
    nohup cursor "$path" > "$log_file" 2>&1 &
    
    local pid=$!
    echo $pid > "$pid_file"
    log "Started $type Claude (PID: $pid)"
    
    # Wait for process to be ready
    local attempts=0
    while (( attempts < 10 )); do
        if ps -p $pid >/dev/null; then
            log "$type Claude is running"
            return 0
        fi
        sleep 1
        (( attempts++ ))
    done
    
    log "Failed to start $type Claude"
    return 1
}

# Launch system Claude
launch_cursor "system" "$AI_SYSTEM_PATH" || exit 1

# Wait a bit to prevent race conditions
sleep 2

# Launch project Claude
launch_cursor "project" "$PROJECT_PATH" || exit 1

log "Both instances launched successfully"

# Keep script running to maintain the processes
while true; do
    sleep 30
    
    # Check if processes are still running
    for type in system project; do
        pid_file="$CURSOR_SHARE/run/cursor_${type}.pid"
        if [[ -f "$pid_file" ]]; then
            pid=$(cat "$pid_file")
            if ! ps -p $pid >/dev/null; then
                log "WARNING: $type Claude (PID: $pid) died"
                log "Attempting to restart $type Claude..."
                launch_cursor "$type" "${type}_PATH" || log "Failed to restart $type Claude"
            fi
        fi
    done
done 