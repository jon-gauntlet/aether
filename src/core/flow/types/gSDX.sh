#!/bin/bash

# Gauntlet Context Integration
# Manages context preservation and AI integration

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
CONTEXT_DIR="${HOME}/.gauntlet/contexts"
STATE_DIR="${HOME}/.gauntlet/state"
CURSOR_CONFIG_DIR="${HOME}/.config/cursor"
CURSOR_CONTEXT_FILE="${CURSOR_CONFIG_DIR}/context.json"

# Ensure directories exist
mkdir -p "$METRICS_DIR" "$CONTEXT_DIR" "$STATE_DIR" "$CURSOR_CONFIG_DIR"

# Initialize context if needed
if [[ ! -f "$CURSOR_CONTEXT_FILE" ]]; then
    echo '{"contexts": [], "projects": {}}' > "$CURSOR_CONTEXT_FILE"
fi

track_cursor_session() {
    local session_id="$1"
    local project_path="$2"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Create session context
    local context_file="${CONTEXT_DIR}/session_${session_id}_${timestamp}.json"
    {
        echo "{"
        echo "  \"session_id\": \"$session_id\","
        echo "  \"project_path\": \"$project_path\","
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"metrics\": {"
        
        # Add focus metrics
        local focus_time
        focus_time=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null | tr -d '\n' || echo "0")
        echo "    \"focus_time\": $((focus_time * 30)),"
        
        # Add flow state
        local flow_state
        flow_state=$(cat "${STATE_DIR}/flow_state" 2>/dev/null | tr -d '\n' || echo "0")
        echo "    \"flow_state\": $flow_state,"
        
        # Add active files
        echo "    \"active_files\": ["
        if [[ -f "${METRICS_DIR}/active_files" ]]; then
            local first=true
            while IFS= read -r file; do
                if [[ "$first" == "true" ]]; then
                    first=false
                else
                    echo ","
                fi
                echo "      \"$file\""
            done < "${METRICS_DIR}/active_files"
        fi
        echo "    ],"
        
        # Add git context
        if [[ -d "$project_path" ]]; then
            echo "    \"git_context\": {"
            cd "$project_path" || exit
            echo "      \"branch\": \"$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')\","
            echo "      \"last_commit\": \"$(git log -1 --pretty=format:%h 2>/dev/null || echo 'unknown')\","
            echo "      \"changes\": $(git status --porcelain 2>/dev/null | wc -l || echo "0")
            echo "    }"
        else
            echo "    \"git_context\": {}"
        fi
        
        echo "  }"
        echo "}"
    } > "$context_file"
    
    # Update Cursor context
    local cursor_context
    cursor_context=$(cat "$CURSOR_CONTEXT_FILE")
    
    # Add new context to array
    cursor_context=$(echo "$cursor_context" | jq --arg sid "$session_id" --arg cf "$context_file" \
        '.contexts += [{"session": $sid, "context_file": $cf}]')
    
    # Update project context
    if [[ -d "$project_path" ]]; then
        cursor_context=$(echo "$cursor_context" | jq --arg path "$project_path" --arg cf "$context_file" \
            '.projects[$path] = (.projects[$path] // []) + [$cf]')
    fi
    
    echo "$cursor_context" > "$CURSOR_CONTEXT_FILE"
}

integrate_project_context() {
    local project_path="$1"
    local output_file="$2"
    
    # Get all context files for this project
    local context_files
    context_files=$(jq -r --arg path "$project_path" '.projects[$path][]' "$CURSOR_CONTEXT_FILE" 2>/dev/null)
    
    if [[ -n "$context_files" ]]; then
        {
            echo "Project Context Summary:"
            echo "======================="
            echo
            
            # Aggregate focus metrics
            local total_focus_time=0
            local flow_states=0
            while IFS= read -r context_file; do
                if [[ -f "$context_file" ]]; then
                    local focus_time
                    focus_time=$(jq -r '.metrics.focus_time' "$context_file")
                    total_focus_time=$((total_focus_time + focus_time))
                    
                    local flow_state
                    flow_state=$(jq -r '.metrics.flow_state' "$context_file")
                    flow_states=$((flow_states + flow_state))
                fi
            done <<< "$context_files"
            
            echo "Total Focus Time: $(format_time "$total_focus_time")"
            echo "Flow States Achieved: $flow_states"
            echo
            
            # Get most active files
            echo "Most Active Files:"
            while IFS= read -r context_file; do
                if [[ -f "$context_file" ]]; then
                    jq -r '.metrics.active_files[]' "$context_file" 2>/dev/null
                fi
            done <<< "$context_files" | sort | uniq -c | sort -nr | head -5 | while read -r count file; do
                echo "  $count: ${file##*/}"
            done
            echo
            
            # Get git activity
            echo "Git Activity:"
            while IFS= read -r context_file; do
                if [[ -f "$context_file" ]]; then
                    local changes
                    changes=$(jq -r '.metrics.git_context.changes' "$context_file")
                    echo "  Session $(jq -r '.session_id' "$context_file"): $changes changes"
                fi
            done <<< "$context_files"
            
        } > "$output_file"
    else
        echo "No context available for this project." > "$output_file"
    fi
}

format_time() {
    local seconds="$1"
    local hours=0
    local minutes=0
    
    if [[ "$seconds" =~ ^[0-9]+$ ]]; then
        hours=$((seconds / 3600))
        minutes=$(( (seconds % 3600) / 60 ))
    fi
    
    printf "%dh %dm" "$hours" "$minutes"
}

# Main loop
while true; do
    # Monitor for new Cursor sessions
    for pid in $(pgrep -f "cursor"); do
        session_id="cursor_${pid}"
        
        # Get project path from process
        project_path=$(pwdx "$pid" 2>/dev/null | awk '{print $2}' || echo "unknown")
        
        # Only track if in a project directory
        if [[ "$project_path" != "unknown" ]] && [[ -d "$project_path/.git" ]]; then
            track_cursor_session "$session_id" "$project_path"
            
            # Generate context summary
            integrate_project_context "$project_path" "${CONTEXT_DIR}/summary_${session_id}.txt"
        fi
    done
    
    # Clean old context files (keep last 30 days)
    find "$CONTEXT_DIR" -type f -mtime +30 -delete
    
    sleep 60
done 