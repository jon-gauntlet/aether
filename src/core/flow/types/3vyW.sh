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
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure clean exit
    trap 'rm -f "$temp_file"' EXIT
    
    # Build JSON using jq with strict error handling
    local focus_time=0
    if [[ -f "${METRICS_DIR}/focus_time.log" ]]; then
        focus_time=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null | tr -d '\n' || echo "0")
        focus_time=$((focus_time * 30))
    fi
    
    local flow_state=0
    if [[ -f "${STATE_DIR}/flow_state" ]]; then
        flow_state=$(cat "${STATE_DIR}/flow_state" 2>/dev/null | tr -d '\n' || echo "0")
    fi
    
    local active_files="[]"
    if [[ -f "${METRICS_DIR}/active_files" ]]; then
        if ! active_files=$(while IFS= read -r line; do
            [[ -n "$line" ]] && printf '%s\n' "$line"
        done < "${METRICS_DIR}/active_files" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null); then
            active_files="[]"
        fi
    fi
    
    local git_context="{}"
    if [[ -d "$project_path" ]]; then
        cd "$project_path" || exit
        local branch
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null | tr -d '\n' || echo "unknown")
        local commit
        commit=$(git log -1 --pretty=format:%h 2>/dev/null | tr -d '\n' || echo "unknown")
        local changes
        changes=$(git status --porcelain 2>/dev/null | wc -l | tr -d '\n' || echo "0")
        
        if ! git_context=$(jq -n \
            --arg branch "$branch" \
            --arg commit "$commit" \
            --argjson changes "$changes" \
            '{branch: $branch, last_commit: $commit, changes: $changes}' 2>/dev/null); then
            git_context="{}"
        fi
    fi
    
    # Validate all numeric values
    if ! [[ "$focus_time" =~ ^[0-9]+$ ]]; then
        focus_time=0
    fi
    if ! [[ "$flow_state" =~ ^[0-9]+$ ]]; then
        flow_state=0
    fi
    
    # Generate context JSON with validation
    if ! jq -n \
        --arg sid "$session_id" \
        --arg path "$project_path" \
        --arg ts "$timestamp" \
        --argjson ft "$focus_time" \
        --argjson fs "$flow_state" \
        --argjson af "$active_files" \
        --argjson gc "$git_context" \
        '{
            session_id: $sid,
            project_path: $path,
            timestamp: $ts,
            metrics: {
                focus_time: $ft,
                flow_state: $fs,
                active_files: $af,
                git_context: $gc
            }
        }' > "$temp_file" 2>/dev/null; then
        echo "Error generating context JSON, using fallback format"
        echo "{}" > "$context_file"
        return 1
    fi
    
    # Validate generated JSON before moving to final location
    if jq '.' "$temp_file" >/dev/null 2>&1; then
        mv "$temp_file" "$context_file"
    else
        echo "Error: Invalid JSON generated, using fallback format"
        echo "{}" > "$context_file"
        return 1
    fi
    
    # Update Cursor context with validation
    if [[ -f "${CURSOR_CONFIG_DIR}/context.json" ]]; then
        local cursor_context
        cursor_context=$(cat "${CURSOR_CONFIG_DIR}/context.json")
        local temp_cursor
        temp_cursor=$(mktemp)
        
        # Validate existing cursor context
        if ! echo "$cursor_context" | jq '.' >/dev/null 2>&1; then
            echo "Error: Invalid cursor context, initializing new one"
            cursor_context='{"contexts": [], "projects": {}}'
        fi
        
        # Add new context with validation
        if ! echo "$cursor_context" | jq --arg sid "$session_id" --arg cf "$context_file" \
            '. + {contexts: (.contexts + [{session: $sid, context_file: $cf}])}' > "$temp_cursor" 2>/dev/null; then
            echo "Error updating cursor context, skipping update"
            rm -f "$temp_cursor"
            return 1
        fi
        
        # Validate final JSON before moving
        if jq '.' "$temp_cursor" >/dev/null 2>&1; then
            mv "$temp_cursor" "${CURSOR_CONFIG_DIR}/context.json"
        else
            echo "Error: Invalid cursor context generated, skipping update"
            rm -f "$temp_cursor"
            return 1
        fi
    fi
}

integrate_project_context() {
    local project_path="$1"
    local output_file="$2"
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure cleanup
    trap 'cleanup_temp_files "$temp_file"' EXIT
    
    # Get all context files for this project with validation
    if [[ -f "$CURSOR_CONTEXT_FILE" ]]; then
        local context_files
        if ! context_files=$(jq -r --arg path "$project_path" '.projects[$path][]' "$CURSOR_CONTEXT_FILE" 2>/dev/null); then
            handle_error "Failed to extract project context files"
            echo "No context available for this project." > "$output_file"
            return 1
        fi
        
        if [[ -n "$context_files" ]]; then
            {
                echo "Project Context Summary:"
                echo "======================="
                echo
                
                # Aggregate focus metrics with validation
                local total_focus_time=0
                local flow_states=0
                local valid_contexts=0
                
                while IFS= read -r context_file; do
                    if [[ -f "$context_file" ]]; then
                        # Validate context file
                        if ! jq '.' "$context_file" >/dev/null 2>&1; then
                            handle_error "Invalid JSON in context file: $context_file"
                            continue
                        fi
                        
                        # Extract metrics with validation
                        local focus_time=0
                        local flow_state=0
                        
                        focus_time=$(jq -r '.metrics.focus_time // 0' "$context_file" 2>/dev/null || echo "0")
                        flow_state=$(jq -r '.metrics.flow_state // 0' "$context_file" 2>/dev/null || echo "0")
                        
                        # Validate numeric values
                        if [[ "$focus_time" =~ ^[0-9]+$ ]] && [[ "$flow_state" =~ ^[0-9]+$ ]]; then
                            total_focus_time=$((total_focus_time + focus_time))
                            flow_states=$((flow_states + flow_state))
                            valid_contexts=$((valid_contexts + 1))
                        else
                            handle_error "Invalid numeric values in context file: $context_file"
                        fi
                    fi
                done <<< "$context_files"
                
                if [[ $valid_contexts -gt 0 ]]; then
                    echo "Total Focus Time: $(format_time "$total_focus_time")"
                    echo "Flow States Achieved: $flow_states"
                    echo "Valid Contexts Processed: $valid_contexts"
                else
                    echo "No valid context data available"
                fi
                echo
                
                # Get most active files with validation
                echo "Most Active Files:"
                {
                    while IFS= read -r context_file; do
                        if [[ -f "$context_file" ]] && jq '.' "$context_file" >/dev/null 2>&1; then
                            jq -r '.metrics.active_files[]?' "$context_file" 2>/dev/null
                        fi
                    done <<< "$context_files"
                } | sort | uniq -c | sort -nr | head -5 | while read -r count file; do
                    if [[ -n "$file" ]]; then
                        echo "  $count: ${file##*/}"
                    fi
                done
                echo
                
                # Get git activity with validation
                echo "Git Activity:"
                local total_changes=0
                local valid_git_contexts=0
                
                while IFS= read -r context_file; do
                    if [[ -f "$context_file" ]] && jq '.' "$context_file" >/dev/null 2>&1; then
                        local changes
                        changes=$(jq -r '.metrics.git_context.changes // 0' "$context_file" 2>/dev/null || echo "0")
                        if [[ "$changes" =~ ^[0-9]+$ ]]; then
                            echo "  Session $(jq -r '.session_id' "$context_file"): $changes changes"
                            total_changes=$((total_changes + changes))
                            valid_git_contexts=$((valid_git_contexts + 1))
                        fi
                    fi
                done <<< "$context_files"
                
                if [[ $valid_git_contexts -gt 0 ]]; then
                    echo "Total Changes: $total_changes"
                    echo "Average Changes per Session: $((total_changes / valid_git_contexts))"
                fi
                
            } > "$temp_file"
            
            # Move final output
            mv "$temp_file" "$output_file"
        else
            echo "No context available for this project." > "$output_file"
        fi
    else
        handle_error "Context tracking not initialized"
        echo "Context tracking not initialized." > "$output_file"
        return 1
    fi
}

format_time() {
    local seconds="${1:-0}"
    local hours=0
    local minutes=0
    
    if [[ "$seconds" =~ ^[0-9]+$ ]]; then
        hours=$((seconds / 3600))
        minutes=$(( (seconds % 3600) / 60 ))
        printf "%dh %dm" "$hours" "$minutes"
    else
        echo "0h 0m"
    fi
}

# Main loop with error handling
main() {
    while true; do
        # Monitor for new Cursor sessions with error handling
        while IFS= read -r pid; do
            session_id="cursor_${pid}"
            
            # Get project path from process with validation
            project_path=$(pwdx "$pid" 2>/dev/null | awk '{print $2}' || echo "unknown")
            
            # Only track if in a project directory
            if [[ "$project_path" != "unknown" ]] && [[ -d "$project_path/.git" ]]; then
                track_cursor_session "$session_id" "$project_path" || handle_error "Failed to track session $session_id"
                
                # Generate context summary with error handling
                local summary_file="${CONTEXT_DIR}/summary_${session_id}.txt"
                integrate_project_context "$project_path" "$summary_file" || handle_error "Failed to integrate context for $project_path"
            fi
        done < <(pgrep -f "cursor" 2>/dev/null || true)
        
        # Clean old context files with error handling
        if ! find "$CONTEXT_DIR" -type f -mtime +30 -delete 2>/dev/null; then
            handle_error "Failed to clean old context files"
        fi
        
        sleep 60
    done
}

# Start main loop with error handling
main || handle_error "Main loop failed" 