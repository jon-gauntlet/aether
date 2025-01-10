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

mkdir -p "$AI_DIR"/{strategies,feedback,models}

generate_ai_context() {
    local project_path="$1"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local context_file="${AI_DIR}/context_${timestamp}.json"
    
    # Get latest metrics
    local metrics_file
    metrics_file=$(ls -t "${METRICS_DIR}"/*.json 2>/dev/null | head -1 || echo "")
    
    # Get latest learning data
    local learning_file
    learning_file=$(ls -t "${LEARNING_DIR}/models"/*_model.md 2>/dev/null | head -1 || echo "")
    
    # Get latest advanced context
    local advanced_file
    advanced_file=$(cat "${STATE_DIR}/latest_advanced_context" 2>/dev/null || echo "")
    
    # Combine all context sources
    {
        echo "# AI Context for $(basename "$project_path")"
        echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
        echo
        echo "## Current Metrics"
        if [[ -f "$metrics_file" ]]; then
            jq -r '. | to_entries | .[] | "- \(.key): \(.value)"' "$metrics_file" || echo "No metrics available"
        else
            echo "No metrics available"
        fi
        echo
        echo "## Learning Model"
        if [[ -f "$learning_file" ]]; then
            cat "$learning_file"
        else
            echo "No learning model available"
        fi
        echo
        echo "## Advanced Context"
        if [[ -f "$advanced_file" ]]; then
            jq -r '. | to_entries | .[] | "### \(.key)\n\(.value | to_entries | map("- \(.key): \(.value)") | .[])"' "$advanced_file" || echo "No advanced context available"
        else
            echo "No advanced context available"
        fi
    } > "${context_file}.md"
    
    # Generate JSON version for programmatic use
    jq -n \
        --arg path "$project_path" \
        --arg ts "$timestamp" \
        --slurpfile metrics "$([ -f "$metrics_file" ] && echo "$metrics_file" || echo /dev/null)" \
        --raw-input \
        --slurp \
        --arg learning "$(cat "$learning_file" 2>/dev/null || echo "")" \
        --slurpfile advanced "$([ -f "$advanced_file" ] && echo "$advanced_file" || echo /dev/null)" \
        '{
            project_path: $path,
            timestamp: $ts,
            metrics: ($metrics[0] // {}),
            learning_model: $learning,
            advanced_context: ($advanced[0] // {})
        }' > "$context_file" 2>/dev/null || echo "{}" > "$context_file"
    
    # Update Cursor context
    if [[ -f "${CURSOR_CONFIG_DIR}/context.json" ]]; then
        local cursor_context
        cursor_context=$(cat "${CURSOR_CONFIG_DIR}/context.json")
        
        # Add AI context
        cursor_context=$(echo "$cursor_context" | jq --arg path "$project_path" --arg cf "$context_file" \
            '. + {ai_context: {($path): $cf}}')
        
        echo "$cursor_context" > "${CURSOR_CONFIG_DIR}/context.json"
    fi
}

generate_ai_strategy() {
    local project_path="$1"
    local output_file="${AI_DIR}/strategies/$(basename "$project_path")_strategy.md"
    
    # Get latest context
    local context_file
    context_file=$(ls -t "${AI_DIR}"/context_*.json 2>/dev/null | head -1 || echo "")
    
    if [[ -f "$context_file" ]]; then
        {
            echo "# AI Strategy for $(basename "$project_path")"
            echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
            echo
            
            echo "## Current State"
            jq -r '.metrics | to_entries | .[] | "- \(.key): \(.value)"' "$context_file" || echo "No metrics available"
            echo
            
            echo "## Learning Insights"
            jq -r '.learning_model' "$context_file" || echo "No learning model available"
            echo
            
            echo "## Quality Metrics"
            jq -r '.advanced_context | to_entries | .[] | "### \(.key)\n\(.value | to_entries | map("- \(.key): \(.value)") | .[])"' "$context_file" || echo "No quality metrics available"
            echo
            
            echo "## Recommendations"
            
            # Focus recommendations
            local focus_time
            focus_time=$(jq -r '.metrics.focus_time // 0' "$context_file")
            if [[ "$focus_time" -lt 1800 ]]; then
                echo "- Increase focus sessions to at least 30 minutes"
                echo "- Use Pomodoro technique: 25 minutes focus, 5 minutes break"
            else
                echo "- Maintain current focus pattern"
                echo "- Consider increasing session length if energy permits"
            fi
            
            # Quality recommendations
            local quality_score
            quality_score=$(jq -r '.advanced_context.python_files.score // 0' "$context_file")
            if [[ "${quality_score%.*}" -lt 8 ]]; then
                echo "- Improve code quality score (current: $quality_score)"
                echo "- Run linters before commits"
                echo "- Address high-priority issues first"
            fi
            
            # Documentation recommendations
            local doc_score
            doc_score=$(jq -r '.advanced_context.documentation.doc_score // 0' "$context_file")
            if [[ "${doc_score%.*}" -lt 7 ]]; then
                echo "- Enhance documentation (current score: $doc_score)"
                echo "- Add more examples and usage instructions"
                echo "- Keep README.md up to date"
            fi
            
            echo
            echo "## Next Actions"
            echo "1. Review and implement recommendations"
            echo "2. Monitor metrics for improvement"
            echo "3. Update documentation as needed"
            echo "4. Run tests and maintain coverage"
            
        } > "$output_file"
    fi
}

track_ai_feedback() {
    local project_path="$1"
    local feedback_file="${AI_DIR}/feedback/$(basename "$project_path")_feedback.json"
    
    # Get latest context and strategy
    local context_file
    context_file=$(ls -t "${AI_DIR}"/context_*.json 2>/dev/null | head -1 || echo "")
    local strategy_file
    strategy_file=$(ls -t "${AI_DIR}/strategies"/*_strategy.md 2>/dev/null | head -1 || echo "")
    
    if [[ -f "$context_file" ]] && [[ -f "$strategy_file" ]]; then
        # Calculate effectiveness scores
        local focus_improvement
        focus_improvement=$(jq -r '.metrics.focus_time' "$context_file")
        local quality_improvement
        quality_improvement=$(jq -r '.advanced_context.python_files.score // 0' "$context_file")
        local doc_improvement
        doc_improvement=$(jq -r '.advanced_context.documentation.doc_score // 0' "$context_file")
        
        # Generate feedback
        jq -n \
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
                effectiveness_score: (($fi / 3600 + $qi + $di) / 3)
            }' > "$feedback_file"
    fi
}

# Main loop
while true; do
    # Monitor for active projects
    while IFS= read -r context_file; do
        if [[ -f "$context_file" ]]; then
            project_path=$(jq -r '.project_path' "$context_file")
            
            if [[ -d "$project_path" ]]; then
                # Generate AI context and strategy
                generate_ai_context "$project_path"
                generate_ai_strategy "$project_path"
                track_ai_feedback "$project_path"
            fi
        fi
    done < <(find "$CONTEXT_DIR" -type f -name "session_*.json" -mmin -5)
    
    sleep 300  # Run every 5 minutes
done 