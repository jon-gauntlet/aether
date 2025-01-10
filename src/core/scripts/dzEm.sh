#!/bin/bash

# Gauntlet AI Optimizer
# Manages AI optimization and feedback loops

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
CONTEXT_DIR="${HOME}/.gauntlet/contexts"
LEARNING_DIR="${HOME}/.gauntlet/learning"
ADVANCED_DIR="${HOME}/.gauntlet/advanced"
AI_DIR="${HOME}/.gauntlet/ai"
STATE_DIR="${HOME}/.gauntlet/state"
CURSOR_CONFIG_DIR="${HOME}/.config/cursor"

# Ensure all required directories exist
mkdir -p "$AI_DIR"/{strategies,feedback,models}

# Error handling functions
handle_error() {
    local error_msg="$1"
    local error_file="${AI_DIR}/errors_$(date +%Y%m%d).log"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $error_msg" >> "$error_file"
    echo "Error: $error_msg" >&2
}

cleanup_temp_files() {
    local temp_files=("$@")
    for file in "${temp_files[@]}"; do
        [[ -f "$file" ]] && rm -f "$file"
    done
}

validate_json() {
    local json_file="$1"
    local fallback_file="$2"
    if ! jq '.' "$json_file" >/dev/null 2>&1; then
        handle_error "Invalid JSON in $json_file"
        echo "{}" > "$fallback_file"
        return 1
    fi
    return 0
}

generate_ai_context() {
    local project_path="$1"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local context_file="${AI_DIR}/context_${timestamp}.json"
    local temp_file
    temp_file=$(mktemp)
    local temp_metrics
    temp_metrics=$(mktemp)
    local temp_advanced
    temp_advanced=$(mktemp)
    
    # Ensure cleanup on exit
    trap 'cleanup_temp_files "$temp_file" "$temp_metrics" "$temp_advanced"' EXIT
    
    # Get latest metrics with validation
    local metrics_file
    metrics_file=$(ls -t "${METRICS_DIR}"/*.json 2>/dev/null | head -1 || echo "")
    if [[ -f "$metrics_file" ]]; then
        if ! jq '.' "$metrics_file" > "$temp_metrics" 2>/dev/null; then
            handle_error "Invalid metrics JSON"
            echo "{}" > "$temp_metrics"
        fi
    else
        echo "{}" > "$temp_metrics"
    fi
    
    # Get latest learning data
    local learning_file
    learning_file=$(ls -t "${LEARNING_DIR}/models"/*_model.md 2>/dev/null | head -1 || echo "")
    local learning_content
    if [[ -f "$learning_file" ]]; then
        learning_content=$(cat "$learning_file" 2>/dev/null || echo "")
    else
        learning_content=""
    fi
    
    # Get latest advanced context with validation
    local advanced_file
    advanced_file=$(cat "${STATE_DIR}/latest_advanced_context" 2>/dev/null || echo "")
    if [[ -f "$advanced_file" ]]; then
        if ! jq '.' "$advanced_file" > "$temp_advanced" 2>/dev/null; then
            handle_error "Invalid advanced context JSON"
            echo "{}" > "$temp_advanced"
        fi
    else
        echo "{}" > "$temp_advanced"
    fi
    
    # Generate JSON version with strict error handling
    if ! jq -n \
        --arg path "$project_path" \
        --arg ts "$timestamp" \
        --slurpfile metrics "$temp_metrics" \
        --arg learning "$learning_content" \
        --slurpfile advanced "$temp_advanced" \
        '{
            project_path: $path,
            timestamp: $ts,
            metrics: ($metrics[0] // {}),
            learning_model: $learning,
            advanced_context: ($advanced[0] // {})
        }' > "$temp_file" 2>/dev/null; then
        handle_error "Failed to generate AI context JSON"
        echo "{}" > "$context_file"
        return 1
    fi
    
    # Validate final JSON before moving
    if validate_json "$temp_file" "$context_file"; then
        mv "$temp_file" "$context_file"
    fi
    
    # Generate markdown version with error handling
    {
        echo "# AI Context for $(basename "$project_path")"
        echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
        echo
        echo "## Current Metrics"
        if [[ -f "$temp_metrics" ]]; then
            jq -r '. | to_entries | .[] | "- \(.key): \(.value)"' "$temp_metrics" 2>/dev/null || echo "No metrics available"
        else
            echo "No metrics available"
        fi
        echo
        echo "## Learning Model"
        if [[ -n "$learning_content" ]]; then
            echo "$learning_content"
        else
            echo "No learning model available"
        fi
        echo
        echo "## Advanced Context"
        if [[ -f "$temp_advanced" ]]; then
            jq -r '. | to_entries | .[] | "### \(.key)\n\(.value | to_entries | map("- \(.key): \(.value)") | .[])"' "$temp_advanced" 2>/dev/null || echo "No advanced context available"
        else
            echo "No advanced context available"
        fi
    } > "${context_file}.md"
    
    # Update Cursor context with validation
    if [[ -f "${CURSOR_CONFIG_DIR}/context.json" ]]; then
        local cursor_context
        local temp_cursor
        temp_cursor=$(mktemp)
        
        # Validate existing cursor context
        if ! jq '.' "${CURSOR_CONFIG_DIR}/context.json" > "$temp_cursor" 2>/dev/null; then
            handle_error "Invalid cursor context JSON"
            echo '{"ai_context":{}}' > "$temp_cursor"
        fi
        
        # Update with new context
        if ! jq --arg path "$project_path" --arg cf "$context_file" \
            '. * {ai_context: {($path): $cf}}' "$temp_cursor" > "${temp_cursor}.new" 2>/dev/null; then
            handle_error "Failed to update cursor context"
            cleanup_temp_files "$temp_cursor" "${temp_cursor}.new"
            return 1
        fi
        
        # Validate and move
        if validate_json "${temp_cursor}.new" "$temp_cursor"; then
            mv "${temp_cursor}.new" "${CURSOR_CONFIG_DIR}/context.json"
        fi
        cleanup_temp_files "$temp_cursor"
    fi
}

generate_ai_strategy() {
    local project_path="$1"
    local output_file="${AI_DIR}/strategies/$(basename "$project_path")_strategy.md"
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure cleanup
    trap 'cleanup_temp_files "$temp_file"' EXIT
    
    # Get latest context with validation
    local context_file
    context_file=$(ls -t "${AI_DIR}"/context_*.json 2>/dev/null | head -1 || echo "")
    
    if [[ -f "$context_file" ]] && validate_json "$context_file" "$temp_file"; then
        # Extract metrics with validation
        local focus_time=0
        local quality_score=0
        local doc_score=0
        
        focus_time=$(jq -r '.metrics.focus_time // 0' "$context_file" 2>/dev/null || echo "0")
        quality_score=$(jq -r '.advanced_context.python_files.score // 0' "$context_file" 2>/dev/null || echo "0")
        doc_score=$(jq -r '.advanced_context.documentation.doc_score // 0' "$context_file" 2>/dev/null || echo "0")
        
        # Validate numeric values
        [[ "$focus_time" =~ ^[0-9]+([.][0-9]+)?$ ]] || focus_time=0
        [[ "$quality_score" =~ ^[0-9]+([.][0-9]+)?$ ]] || quality_score=0
        [[ "$doc_score" =~ ^[0-9]+([.][0-9]+)?$ ]] || doc_score=0
        
        {
            echo "# AI Strategy for $(basename "$project_path")"
            echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
            echo
            
            echo "## Current State"
            jq -r '.metrics | to_entries | .[] | "- \(.key): \(.value)"' "$context_file" 2>/dev/null || echo "No metrics available"
            echo
            
            echo "## Learning Insights"
            jq -r '.learning_model' "$context_file" 2>/dev/null || echo "No learning model available"
            echo
            
            echo "## Quality Metrics"
            jq -r '.advanced_context | to_entries | .[] | "### \(.key)\n\(.value | to_entries | map("- \(.key): \(.value)") | .[])"' "$context_file" 2>/dev/null || echo "No quality metrics available"
            echo
            
            echo "## Recommendations"
            
            # Focus recommendations
            if [[ "$focus_time" -lt 1800 ]]; then
                echo "- Increase focus sessions to at least 30 minutes"
                echo "- Use Pomodoro technique: 25 minutes focus, 5 minutes break"
            else
                echo "- Maintain current focus pattern"
                echo "- Consider increasing session length if energy permits"
            fi
            
            # Quality recommendations
            if [[ "${quality_score%.*}" -lt 8 ]]; then
                echo "- Improve code quality score (current: $quality_score)"
                echo "- Run linters before commits"
                echo "- Address high-priority issues first"
            fi
            
            # Documentation recommendations
            if [[ "${doc_score%.*}" -lt 7 ]]; then
                echo "- Enhance documentation (current score: $doc_score)"
                echo "- Add more examples and usage instructions"
                echo "- Keep README.md up to date"
            fi
        } > "$temp_file"
        
        mv "$temp_file" "$output_file"
    else
        handle_error "Invalid or missing context file for strategy generation"
        echo "# AI Strategy Unavailable" > "$output_file"
        echo "No valid context data available for strategy generation." >> "$output_file"
        return 1
    fi
}

track_ai_feedback() {
    local project_path="$1"
    local feedback_file="${AI_DIR}/feedback/$(basename "$project_path")_feedback.json"
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure cleanup
    trap 'cleanup_temp_files "$temp_file"' EXIT
    
    # Get latest context and strategy with validation
    local context_file
    context_file=$(ls -t "${AI_DIR}"/context_*.json 2>/dev/null | head -1 || echo "")
    local strategy_file
    strategy_file=$(ls -t "${AI_DIR}/strategies"/*_strategy.md 2>/dev/null | head -1 || echo "")
    
    if [[ -f "$context_file" ]] && [[ -f "$strategy_file" ]]; then
        # Extract and validate metrics
        local focus_improvement=0
        local quality_improvement=0
        local doc_improvement=0
        
        focus_improvement=$(jq -r '.metrics.focus_time // 0' "$context_file" 2>/dev/null || echo "0")
        quality_improvement=$(jq -r '.advanced_context.python_files.score // 0' "$context_file" 2>/dev/null || echo "0")
        doc_improvement=$(jq -r '.advanced_context.documentation.doc_score // 0' "$context_file" 2>/dev/null || echo "0")
        
        # Validate numeric values
        [[ "$focus_improvement" =~ ^[0-9]+([.][0-9]+)?$ ]] || focus_improvement=0
        [[ "$quality_improvement" =~ ^[0-9]+([.][0-9]+)?$ ]] || quality_improvement=0
        [[ "$doc_improvement" =~ ^[0-9]+([.][0-9]+)?$ ]] || doc_improvement=0
        
        # Generate feedback JSON with validation
        if ! jq -n \
            --arg path "$project_path" \
            --arg ts "$(date +%Y%m%d_%H%M%S)" \
            --argjson fi "$focus_improvement" \
            --argjson qi "$quality_improvement" \
            --argjson di "$doc_improvement" \
            '{
                project_path: $path,
                timestamp: $ts,
                metrics: {
                    focus_improvement: $fi,
                    quality_improvement: $qi,
                    documentation_improvement: $di
                },
                effectiveness_score: ((($fi / 3600) + $qi + $di) / 3)
            }' > "$temp_file" 2>/dev/null; then
            handle_error "Failed to generate feedback JSON"
            echo "{}" > "$feedback_file"
            return 1
        fi
        
        # Validate and move
        if validate_json "$temp_file" "$feedback_file"; then
            mv "$temp_file" "$feedback_file"
        fi
    else
        handle_error "Missing context or strategy files for feedback generation"
        echo "{}" > "$feedback_file"
        return 1
    fi
}

# Main loop with error handling
main() {
    while true; do
        # Monitor for active projects with error handling
        while IFS= read -r context_file; do
            if [[ -f "$context_file" ]]; then
                project_path=$(jq -r '.project_path' "$context_file" 2>/dev/null || echo "")
                
                if [[ -n "$project_path" ]] && [[ -d "$project_path" ]]; then
                    generate_ai_context "$project_path" || handle_error "Failed to generate AI context for $project_path"
                    generate_ai_strategy "$project_path" || handle_error "Failed to generate AI strategy for $project_path"
                    track_ai_feedback "$project_path" || handle_error "Failed to track AI feedback for $project_path"
                fi
            fi
        done < <(find "$CONTEXT_DIR" -type f -name "session_*.json" -mmin -5 2>/dev/null || true)
        
        sleep 300  # Run every 5 minutes
    done
}

# Start main loop with error handling
main || handle_error "Main loop failed" 