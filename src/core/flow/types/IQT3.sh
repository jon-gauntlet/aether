#!/bin/bash

# Gauntlet Learning Integration
# Manages learning models and knowledge integration

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
LEARNING_DIR="${HOME}/.gauntlet/learning"
MODELS_DIR="${LEARNING_DIR}/models"
INSIGHTS_DIR="${LEARNING_DIR}/insights"
STATE_DIR="${HOME}/.gauntlet/state"

# Error handling functions
handle_error() {
    local error_msg="$1"
    local error_file="${LEARNING_DIR}/errors_$(date +%Y%m%d).log"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $error_msg" >> "$error_file"
    echo "Error: $error_msg" >&2
}

cleanup_temp_files() {
    local temp_files=("$@")
    for file in "${temp_files[@]}"; do
        [[ -f "$file" ]] && rm -f "$file"
    done
}

validate_numeric() {
    local value="$1"
    local fallback="$2"
    if [[ "$value" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
        echo "$value"
    else
        echo "$fallback"
    fi
}

ensure_directory() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir" || handle_error "Failed to create directory: $dir"
    fi
}

# Ensure required directories exist
for dir in "$METRICS_DIR" "$LEARNING_DIR" "$MODELS_DIR" "$INSIGHTS_DIR" "$STATE_DIR"; do
    ensure_directory "$dir"
done

generate_learning_model() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local model_file="${MODELS_DIR}/${timestamp}_model.md"
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure cleanup
    trap 'cleanup_temp_files "$temp_file"' EXIT
    
    # Get latest metrics with validation
    local focus_time=0
    local flow_states=0
    local context_switches=0
    local typing_speed=0
    
    if [[ -f "${METRICS_DIR}/focus_time.log" ]]; then
        focus_time=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null || echo "0")
        focus_time=$(validate_numeric "$focus_time" "0")
        focus_time=$((focus_time * 30))  # Convert to seconds
    fi
    
    if [[ -f "${METRICS_DIR}/flow_state.log" ]]; then
        flow_states=$(grep -c "1$" "${METRICS_DIR}/flow_state.log" 2>/dev/null || echo "0")
        flow_states=$(validate_numeric "$flow_states" "0")
    fi
    
    if [[ -f "${METRICS_DIR}/context_switch.log" ]]; then
        context_switches=$(grep -c "1$" "${METRICS_DIR}/context_switch.log" 2>/dev/null || echo "0")
        context_switches=$(validate_numeric "$context_switches" "0")
    fi
    
    if [[ -f "${METRICS_DIR}/typing_speed.log" ]]; then
        typing_speed=$(awk '{sum+=$2} END {print sum/NR}' "${METRICS_DIR}/typing_speed.log" 2>/dev/null || echo "0")
        typing_speed=$(validate_numeric "$typing_speed" "0")
    fi
    
    # Generate model with validation
    {
        echo "# Learning Model (${timestamp})"
        echo
        echo "## Focus Metrics"
        echo "- Total Focus Time: $(printf "%.2f" $((focus_time / 3600)))h"
        echo "- Flow States Achieved: $flow_states"
        echo "- Context Switches: $context_switches"
        echo "- Average Typing Speed: $(printf "%.1f" "$typing_speed") keys/min"
        echo
        
        echo "## Learning Patterns"
        if ((focus_time > 7200)); then  # More than 2 hours
            echo "- Strong focus patterns detected"
            echo "- Extended concentration periods"
        else
            echo "- Building focus stamina"
            echo "- Short focus bursts"
        fi
        
        if ((flow_states > 5)); then
            echo "- Frequent flow state achievement"
            echo "- Deep work capability"
        else
            echo "- Flow state development needed"
            echo "- Potential distractions present"
        fi
        
        if ((context_switches < 20)); then
            echo "- Good context maintenance"
            echo "- Task completion focus"
        else
            echo "- High context switching"
            echo "- Consider focus techniques"
        fi
        
        if ((typing_speed > 60)); then
            echo "- Efficient code generation"
            echo "- Strong typing fluency"
        else
            echo "- Building typing efficiency"
            echo "- Practice recommended"
        fi
        echo
        
        echo "## Recommendations"
        if ((focus_time < 7200)); then
            echo "- Increase focus session duration"
            echo "- Use Pomodoro technique"
        fi
        
        if ((flow_states < 5)); then
            echo "- Minimize interruptions"
            echo "- Create focus environment"
        fi
        
        if ((context_switches > 20)); then
            echo "- Batch similar tasks"
            echo "- Use task lists"
        fi
        
        if ((typing_speed < 60)); then
            echo "- Practice typing exercises"
            echo "- Learn keyboard shortcuts"
        fi
    } > "$temp_file" || {
        handle_error "Failed to generate learning model"
        return 1
    }
    
    # Move to final location
    mv "$temp_file" "$model_file" || {
        handle_error "Failed to save learning model"
        return 1
    }
    
    # Update latest model link with error handling
    local latest_link="${MODELS_DIR}/latest_model.md"
    ln -sf "$model_file" "$latest_link" || handle_error "Failed to update latest model link"
}

generate_learning_insights() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local insight_file="${INSIGHTS_DIR}/${timestamp}_insights.md"
    local temp_file
    temp_file=$(mktemp)
    
    # Ensure cleanup
    trap 'cleanup_temp_files "$temp_file"' EXIT
    
    # Get latest model with validation
    local latest_model
    latest_model=$(readlink -f "${MODELS_DIR}/latest_model.md" 2>/dev/null || echo "")
    
    if [[ -f "$latest_model" ]]; then
        {
            echo "# Learning Insights (${timestamp})"
            echo
            echo "## Current State"
            grep -A 4 "^## Focus Metrics" "$latest_model" || echo "No focus metrics available"
            echo
            
            echo "## Pattern Analysis"
            grep -A 4 "^## Learning Patterns" "$latest_model" || echo "No learning patterns available"
            echo
            
            echo "## Action Items"
            grep -A 4 "^## Recommendations" "$latest_model" || echo "No recommendations available"
            echo
            
            echo "## Next Steps"
            if grep -q "Strong focus patterns" "$latest_model"; then
                echo "- Maintain current focus practices"
                echo "- Consider increasing challenge level"
            else
                echo "- Implement focus improvement strategies"
                echo "- Review environment for distractions"
            fi
            
            if grep -q "Frequent flow state" "$latest_model"; then
                echo "- Document flow state triggers"
                echo "- Optimize peak performance windows"
            else
                echo "- Identify flow state blockers"
                echo "- Create flow state routine"
            fi
        } > "$temp_file" || {
            handle_error "Failed to generate learning insights"
            return 1
        }
        
        # Move to final location
        mv "$temp_file" "$insight_file" || {
            handle_error "Failed to save learning insights"
            return 1
        }
        
        # Update latest insights link with error handling
        local latest_link="${INSIGHTS_DIR}/latest_insights.md"
        ln -sf "$insight_file" "$latest_link" || handle_error "Failed to update latest insights link"
    else
        handle_error "No learning model available for insight generation"
        return 1
    fi
}

cleanup_old_models() {
    local days="$1"
    # Clean old models with error handling
    if ! find "$MODELS_DIR" -type f -mtime +"$days" -not -name "latest_model.md" -delete 2>/dev/null; then
        handle_error "Failed to clean old models"
        return 1
    fi
    
    # Clean old insights with error handling
    if ! find "$INSIGHTS_DIR" -type f -mtime +"$days" -not -name "latest_insights.md" -delete 2>/dev/null; then
        handle_error "Failed to clean old insights"
        return 1
    fi
}

# Main loop with error handling
main() {
    while true; do
        generate_learning_model || handle_error "Failed to generate learning model"
        generate_learning_insights || handle_error "Failed to generate learning insights"
        
        # Clean old files every hour
        if [[ "$(date +%M)" == "00" ]]; then
            cleanup_old_models 7 || handle_error "Failed to clean old files"
        fi
        
        sleep 300  # Run every 5 minutes
    done
}

# Start main loop with error handling
main || handle_error "Main loop failed" 