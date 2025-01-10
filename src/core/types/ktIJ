#!/bin/bash

# Enhanced Context Crystallizer for High-Load Sessions
# Optimized for ADHD hyperfocus states and 80-100hr weeks

set -euo pipefail

# Configuration
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
CRYSTALLIZED_DIR="$CURSOR_DATA_DIR/crystallized"
ACTIVE_CONTEXT="$CURSOR_STATE_DIR/active_context.json"
CONTEXT_HISTORY="$CURSOR_STATE_DIR/context_history.jsonl"

# Performance Settings
MAX_CONTEXT_SIZE=1000000  # 1MB for high-load sessions
OPTIMIZATION_THRESHOLD=0.85  # Higher threshold for intensive work
CRYSTAL_RETENTION_DAYS=14  # Extended retention for long sessions
CHECK_INTERVAL=2  # Faster checks for responsive preservation
MEMORY_CHECK_INTERVAL=30  # More frequent memory checks

# Ensure directories exist
mkdir -p "$CURSOR_STATE_DIR" "$CRYSTALLIZED_DIR" "$CURSOR_STATE_DIR/backups"
mkdir -p "$CURSOR_CONFIG_DIR/contexts"/{system,general,projects,sacred,gauntlet}

# Initialize state if needed
touch "$ACTIVE_CONTEXT"
touch "$CONTEXT_HISTORY"

# Helper Functions
log() {
    echo "[$(date -Iseconds)] $*" >&2
}

notify_systemd() {
    echo "$1"
    [ -n "${NOTIFY_SOCKET:-}" ] && systemd-notify "$1"
}

backup_context() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    cp "$ACTIVE_CONTEXT" "$CURSOR_STATE_DIR/backups/context_$timestamp.json"
    find "$CURSOR_STATE_DIR/backups" -name "context_*.json" -mtime +7 -delete
}

optimize_context() {
    local context_file=$1
    local temp_file=$(mktemp)
    
    jq -c --arg max "$MAX_CONTEXT_SIZE" '
    def score(obj):
        (obj.importance // 0) * 3 +
        (obj.frequency // 0) * 2 +
        (obj.recent // 0) * 4 +
        (if obj.type == "sacred" then 200
         elif obj.type == "gauntlet" then 150
         elif obj.type == "general" then 75
         else 0 end) +
        (if obj.source == "hyperfocus" then 100 else 0 end) +
        (if obj.category == "principle" then 100
         elif obj.category == "pattern" then 60
         else 0 end);
    
    def optimize_array(arr):
        arr | sort_by(score(.)) | reverse |
        while(
            (. | tojson | length) > ($max | tonumber);
            map(select(.type == "sacred" or .type == "gauntlet")) +
            (map(select(.type != "sacred" and .type != "gauntlet")) | .[0:-1])
        );
    
    {
        concepts: optimize_array(.concepts),
        state: (.state | with_entries(
            select(
                .value.type == "sacred" or
                .value.type == "gauntlet" or
                .value.priority > 0.8
            )
        )),
        patterns: optimize_array(.patterns),
        principles: .principles,
        metrics: .metrics,
        optimized_at: now
    }' "$context_file" > "$temp_file"
    
    mv "$temp_file" "$context_file"
}

crystallize_session() {
    local session_data=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local crystal_file="$CRYSTALLIZED_DIR/session_${timestamp}.json"
    
    jq -c '{
        timestamp: now,
        type: "session",
        essence: {
            key_concepts: (.concepts | sort_by(.importance) | reverse | .[0:10]),
            critical_state: (.state | to_entries | sort_by(.value.priority) | reverse | .[0:5]),
            learned_patterns: (.patterns | sort_by(.frequency) | reverse | .[0:7]),
            active_principles: .principles
        },
        metrics: {
            context_size: (.size // 0),
            interaction_count: (.interactions // 0),
            success_rate: (.success_rate // 0),
            focus_level: (.focus_level // 0)
        },
        tags: ["hyperfocus", "gauntlet"]
    }' <<<"$session_data" > "$crystal_file"
    
    echo "$crystal_file"
}

merge_session_crystals() {
    local cutoff=$(( $(date +%s) - 3600 ))  # Last hour
    
    find "$CRYSTALLIZED_DIR" -name "session_*.json" -type f -newermt "@$cutoff" -print0 |
    xargs -0 cat 2>/dev/null |
    jq -s 'reduce .[] as $item (
        {};
        .timestamp = now |
        .type = "merged_session" |
        .essence.key_concepts = ((.essence.key_concepts // []) + $item.essence.key_concepts | unique) |
        .essence.critical_state = ((.essence.critical_state // []) + $item.essence.critical_state | unique) |
        .essence.learned_patterns = ((.essence.learned_patterns // []) + $item.essence.learned_patterns | unique) |
        .essence.active_principles = ((.essence.active_principles // []) + $item.essence.active_principles | unique) |
        .metrics = {
            context_size: ((.metrics.context_size + $item.metrics.context_size) / 2),
            interaction_count: (.metrics.interaction_count + $item.metrics.interaction_count),
            success_rate: ((.metrics.success_rate + $item.metrics.success_rate) / 2),
            focus_level: ((.metrics.focus_level + $item.metrics.focus_level) / 2)
        }
    )'
}

# Main Loop
notify_systemd "READY=1"
log "Starting Enhanced Context Crystallizer"

while true; do
    notify_systemd "WATCHDOG=1"
    
    # Check active context size
    if [[ -s "$ACTIVE_CONTEXT" ]]; then
        size=$(stat -f%z "$ACTIVE_CONTEXT")
        if (( size > MAX_CONTEXT_SIZE * OPTIMIZATION_THRESHOLD )); then
            log "Context size ($size) exceeds threshold, optimizing..."
            backup_context
            optimize_context "$ACTIVE_CONTEXT"
        fi
    fi
    
    # Crystallize current session
    if [[ -s "$ACTIVE_CONTEXT" ]]; then
        crystal_file=$(crystallize_session "$(cat "$ACTIVE_CONTEXT")")
        log "Crystallized session to $crystal_file"
        
        # Merge recent crystals
        merged=$(merge_session_crystals)
        echo "$merged" > "$CURSOR_STATE_DIR/merged_session.json"
    fi
    
    # Cleanup old crystals while preserving important ones
    find "$CRYSTALLIZED_DIR" -name "session_*.json" -type f -mtime "+$CRYSTAL_RETENTION_DAYS" \
        -exec sh -c 'jq -e ".tags | contains([\"preserve\"])" "{}" >/dev/null || rm "{}"' \;
    
    sleep "$CHECK_INTERVAL"
done 