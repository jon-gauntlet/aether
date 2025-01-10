#!/bin/bash

# Gauntlet Learning Integration
# Analyzes patterns from successful sessions and adapts strategies

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
CONTEXT_DIR="${HOME}/.gauntlet/contexts"
LEARNING_DIR="${HOME}/.gauntlet/learning"
STATE_DIR="${HOME}/.gauntlet/state"

mkdir -p "$LEARNING_DIR"/{patterns,strategies,models}

analyze_session_patterns() {
    local session_id="$1"
    local context_file="$2"
    
    # Extract metrics
    local focus_time
    focus_time=$(jq -r '.metrics.focus_time' "$context_file")
    local flow_state
    flow_state=$(jq -r '.metrics.flow_state' "$context_file")
    local active_files
    active_files=$(jq -r '.metrics.active_files | length' "$context_file")
    
    # Calculate session score (basic algorithm)
    local score
    score=$(( (focus_time / 60) * (flow_state + 1) * (active_files + 1) ))
    
    # Record pattern if score is good (above 75th percentile)
    if [[ $score -gt $(get_score_threshold) ]]; then
        {
            jq -n \
                --arg sid "$session_id" \
                --arg ts "$(date +%Y%m%d_%H%M%S)" \
                --argjson score "$score" \
                --argjson metrics "$(jq '.metrics' "$context_file")" \
                '{
                    session_id: $sid,
                    timestamp: $ts,
                    score: $score,
                    metrics: $metrics,
                    pattern_type: "success"
                }'
        } > "${LEARNING_DIR}/patterns/${session_id}_success.json"
    fi
}

get_score_threshold() {
    # Calculate 75th percentile of historical scores
    find "${LEARNING_DIR}/patterns" -type f -name "*_success.json" -exec jq -r '.score' {} \; | \
        sort -n | \
        awk '{ scores[NR] = $1 } END { print scores[int(NR * 0.75)] }' || echo "100"
}

generate_strategy() {
    local project_path="$1"
    
    # Analyze successful patterns
    local strategies=()
    while IFS= read -r pattern_file; do
        if [[ -f "$pattern_file" ]]; then
            local focus_time
            focus_time=$(jq -r '.metrics.focus_time' "$pattern_file")
            local flow_state
            flow_state=$(jq -r '.metrics.flow_state' "$pattern_file")
            
            # Extract working patterns
            if [[ $focus_time -gt 1800 ]] && [[ $flow_state -gt 0 ]]; then
                strategies+=("Focus blocks of $(( focus_time / 60 )) minutes work well")
            fi
            
            # Check file patterns
            local file_count
            file_count=$(jq -r '.metrics.active_files | length' "$pattern_file")
            if [[ $file_count -lt 5 ]] && [[ $flow_state -gt 1 ]]; then
                strategies+=("Working with fewer files ($file_count) increases flow state")
            fi
            
            # Check git patterns
            local changes
            changes=$(jq -r '.metrics.git_context.changes' "$pattern_file")
            if [[ $changes -gt 0 ]] && [[ $flow_state -gt 1 ]]; then
                strategies+=("Making incremental changes ($changes) maintains flow")
            fi
        fi
    done < <(find "${LEARNING_DIR}/patterns" -type f -name "*_success.json")
    
    # Generate strategy document
    {
        echo "# Generated Strategy for $(basename "$project_path")"
        echo "## Based on $(find "${LEARNING_DIR}/patterns" -type f -name "*_success.json" | wc -l) successful sessions"
        echo
        echo "### Key Patterns:"
        printf '%s\n' "${strategies[@]}" | sort -u | sed 's/^/- /'
        echo
        echo "### Recommendations:"
        echo "1. Break work into focused sessions"
        echo "2. Minimize context switches"
        echo "3. Make incremental commits"
        echo
        echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    } > "${LEARNING_DIR}/strategies/$(basename "$project_path")_strategy.md"
}

adapt_model() {
    local project_path="$1"
    
    # Collect all metrics
    local all_metrics
    all_metrics=$(mktemp)
    
    find "${CONTEXT_DIR}" -type f -name "session_*.json" -exec jq -r \
        '[.metrics.focus_time, .metrics.flow_state, (.metrics.active_files | length), .metrics.git_context.changes] | @csv' {} \; \
        > "$all_metrics"
    
    # Generate simple statistical model
    {
        echo "# Performance Model for $(basename "$project_path")"
        echo "## Based on $(wc -l < "$all_metrics") sessions"
        echo
        echo "### Metrics Distribution:"
        
        # Calculate basic stats
        awk -F, '
            BEGIN { 
                focus_sum = flow_sum = files_sum = changes_sum = 0 
                focus_max = flow_max = files_max = changes_max = 0
            }
            {
                focus_sum += $1; if($1 > focus_max) focus_max = $1
                flow_sum += $2; if($2 > flow_max) flow_max = $2
                files_sum += $3; if($3 > files_max) files_max = $3
                changes_sum += $4; if($4 > changes_max) changes_max = $4
            }
            END {
                n = NR
                printf "Focus Time (avg/max): %.1f min / %.1f min\n", focus_sum/(n*60), focus_max/60
                printf "Flow States (avg/max): %.1f / %.1f\n", flow_sum/n, flow_max
                printf "Active Files (avg/max): %.1f / %.1f\n", files_sum/n, files_max
                printf "Git Changes (avg/max): %.1f / %.1f\n", changes_sum/n, changes_max
            }
        ' "$all_metrics"
        
        echo
        echo "### Performance Indicators:"
        echo "1. High focus time correlates with more git changes"
        echo "2. Fewer active files leads to more flow states"
        echo "3. Regular commits maintain momentum"
        echo
        echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    } > "${LEARNING_DIR}/models/$(basename "$project_path")_model.md"
    
    rm -f "$all_metrics"
}

# Main loop
while true; do
    # Process new session data
    while IFS= read -r context_file; do
        if [[ -f "$context_file" ]]; then
            session_id=$(basename "$context_file" | cut -d_ -f2)
            project_path=$(jq -r '.project_path' "$context_file")
            
            # Analyze patterns
            analyze_session_patterns "$session_id" "$context_file"
            
            # Generate strategy if enough data
            if [[ $(find "${LEARNING_DIR}/patterns" -type f -name "*_success.json" | wc -l) -gt 5 ]]; then
                generate_strategy "$project_path"
                adapt_model "$project_path"
            fi
        fi
    done < <(find "$CONTEXT_DIR" -type f -name "session_*.json" -mmin -2)
    
    sleep 60
done 