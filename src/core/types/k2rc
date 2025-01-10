#!/bin/bash

# Enhanced Context Crystallizer with Meta-Learning Integration
# Optimized for ADHD hyperfocus states and 80-100hr weeks
# Integrates with Meta-Learning System for advanced pattern recognition

set -euo pipefail

# Check for required dependencies
for cmd in jq systemd-notify; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: Required command '$cmd' not found" >&2
        exit 1
    fi
done

# Configuration with existing paths
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
CRYSTALLIZED_DIR="$CURSOR_DATA_DIR/crystallized"
ACTIVE_CONTEXT="$CURSOR_STATE_DIR/active_context.json"
CONTEXT_HISTORY="$CURSOR_STATE_DIR/context_history.jsonl"
META_DIR="$CURSOR_STATE_DIR/meta"

# Verify all required directories exist
for dir in "$CURSOR_CONFIG_DIR" "$CURSOR_STATE_DIR" "$CURSOR_DATA_DIR" "$CRYSTALLIZED_DIR" "$META_DIR"; do
    if [ ! -d "$dir" ]; then
        echo "Error: Required directory '$dir' not found" >&2
        exit 1
    fi
done

# Performance Settings
MAX_CONTEXT_SIZE=2000000  # 2MB for high-load sessions
OPTIMIZATION_THRESHOLD=0.85  # Higher threshold for intensive work
CRYSTAL_RETENTION_DAYS=30  # Extended retention for long sessions
CHECK_INTERVAL=2  # Faster checks for responsive preservation
MEMORY_CHECK_INTERVAL=30  # More frequent memory checks

# Initialize state files with proper JSON if empty
for file in "$ACTIVE_CONTEXT" "$CONTEXT_HISTORY"; do
    if [ ! -s "$file" ]; then
        echo '{"concepts":[],"state":{},"patterns":[],"principles":[],"metrics":{"optimizations":0},"meta":{"version":2}}' > "$file"
    fi
done

# Helper Functions
log() {
    echo "[$(date -Iseconds)] $*" >&2
}

notify_systemd() {
    echo "$1"
    [ -n "${NOTIFY_SOCKET:-}" ] && systemd-notify "$1" || true
}

backup_context() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    cp "$ACTIVE_CONTEXT" "$CURSOR_STATE_DIR/backups/context_$timestamp.json"
    find "$CURSOR_STATE_DIR/backups" -name "context_*.json" -mtime +7 -delete
}

get_meta_insights() {
    if [[ -f "$META_DIR/insights/current.json" ]]; then
        jq -r '.[] | select(.type == "context_insight")' "$META_DIR/insights/current.json" 2>/dev/null || echo '[]'
    else
        echo '[]'
    fi
}

optimize_context() {
    local context_file=$1
    local temp_file=$(mktemp)
    local meta_insights=$(get_meta_insights)
    
    jq -c --arg max "$MAX_CONTEXT_SIZE" \
          --arg insights "$meta_insights" '
    def score(obj):
        # Base scoring
        (obj.importance // 0) * 3 +
        (obj.frequency // 0) * 2 +
        (obj.recent // 0) * 4 +
        
        # Type-based scoring
        (if obj.type == "sacred" then 200
         elif obj.type == "gauntlet" then 150
         elif obj.type == "general" then 75
         else 0 end) +
        
        # Source-based scoring
        (if obj.source == "hyperfocus" then 100
         elif obj.source == "deep_flow" then 150
         else 0 end) +
        
        # Category-based scoring
        (if obj.category == "principle" then 100
         elif obj.category == "pattern" then 60
         else 0 end) +
        
        # Meta-learning integration
        (if ($insights | fromjson | map(select(.related_id == obj.id)) | length) > 0
         then 200 else 0 end);
    
    def optimize_array(arr):
        arr | sort_by(score(.)) | reverse |
        while(
            (. | tojson | length) > ($max | tonumber);
            map(select(.type == "sacred" or .type == "gauntlet" or .source == "deep_flow")) +
            (map(select(.type != "sacred" and .type != "gauntlet" and .source != "deep_flow")) | .[0:-1])
        );
    
    {
        concepts: optimize_array(.concepts),
        state: (.state | with_entries(
            select(
                .value.type == "sacred" or
                .value.type == "gauntlet" or
                .value.source == "deep_flow" or
                .value.priority > 0.9 or
                ($insights | fromjson | map(select(.related_id == .key)) | length) > 0
            )
        )),
        patterns: optimize_array(.patterns),
        principles: .principles,
        metrics: (.metrics + {
            optimizations: (.metrics.optimizations // 0) + 1,
            last_optimized: now,
            meta_insights: ($insights | fromjson | length)
        }),
        meta: {
            last_update: now,
            version: 2,
            optimization_count: (.meta.optimization_count // 0) + 1
        }
    }' "$context_file" > "$temp_file"
    
    mv "$temp_file" "$context_file"
}

crystallize_session() {
    local session_data=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local crystal_file="$CRYSTALLIZED_DIR/session_${timestamp}.json"
    local meta_insights=$(get_meta_insights)
    
    jq -c --arg insights "$meta_insights" '{
        timestamp: now,
        type: "session",
        essence: {
            key_concepts: (.concepts | sort_by(.importance) | reverse | .[0:10]),
            critical_state: (.state | to_entries | sort_by(.value.priority) | reverse | .[0:5]),
            learned_patterns: (.patterns | sort_by(.frequency) | reverse | .[0:7]),
            active_principles: .principles,
            meta_insights: ($insights | fromjson)
        },
        metrics: {
            context_size: (.size // 0),
            interaction_count: (.interactions // 0),
            success_rate: (.success_rate // 0),
            focus_level: (.focus_level // 0),
            meta_enhanced: true
        },
        tags: ["hyperfocus", "gauntlet", "meta_learning"]
    }' <<<"$session_data" > "$crystal_file"
    
    echo "$crystal_file"
}

merge_session_crystals() {
    local cutoff=$(( $(date +%s) - 3600 ))  # Last hour
    local meta_insights=$(get_meta_insights)
    
    find "$CRYSTALLIZED_DIR" -name "session_*.json" -type f -newermt "@$cutoff" -print0 |
    xargs -0 cat 2>/dev/null |
    jq -s --arg insights "$meta_insights" '
    reduce .[] as $item (
        {};
        .timestamp = now |
        .type = "merged_session" |
        .essence.key_concepts = ((.essence.key_concepts // []) + $item.essence.key_concepts | unique) |
        .essence.critical_state = ((.essence.critical_state // []) + $item.essence.critical_state | unique) |
        .essence.learned_patterns = ((.essence.learned_patterns // []) + $item.essence.learned_patterns | unique) |
        .essence.active_principles = ((.essence.active_principles // []) + $item.essence.active_principles | unique) |
        .essence.meta_insights = ($insights | fromjson) |
        .metrics = {
            context_size: ((.metrics.context_size + $item.metrics.context_size) / 2),
            interaction_count: (.metrics.interaction_count + $item.metrics.interaction_count),
            success_rate: ((.metrics.success_rate + $item.metrics.success_rate) / 2),
            focus_level: ((.metrics.focus_level + $item.metrics.focus_level) / 2),
            meta_enhanced: true
        }
    )'
}

# Main Loop
notify_systemd "READY=1"
log "Starting Enhanced Context Crystallizer with Meta-Learning"

while true; do
    notify_systemd "WATCHDOG=1"
    
    # Check active context size
    if [[ -s "$ACTIVE_CONTEXT" ]]; then
        size=$(stat -f %z "$ACTIVE_CONTEXT" 2>/dev/null || stat --format=%s "$ACTIVE_CONTEXT")
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
        -exec sh -c 'jq -e ".tags | contains([\"preserve\", \"deep_flow\"])" "{}" >/dev/null || rm "{}"' \;
    
    sleep "$CHECK_INTERVAL"
done 