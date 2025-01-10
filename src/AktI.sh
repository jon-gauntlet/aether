#!/bin/bash

# Gauntlet Dashboard
# Live monitoring of development metrics with ADHD focus

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
STATE_DIR="${HOME}/.gauntlet/state"

print_header() {
    clear
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    GAUNTLET DEVELOPMENT METRICS                 ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo
}

print_section() {
    local title="$1"
    echo "┌─────────────────── $title ───────────────────┐"
}

print_footer() {
    echo "└────────────────────────────────────────────────┘"
    echo
}

format_time() {
    local seconds="${1:-0}"
    local hours=0
    local minutes=0
    
    if [[ "$seconds" =~ ^[0-9]+$ ]]; then
        hours=$((seconds / 3600))
        minutes=$(( (seconds % 3600) / 60 ))
    fi
    
    printf "%dh %dm" "$hours" "$minutes"
}

show_focus_metrics() {
    print_section "Focus Metrics"
    
    # Calculate total focus time
    local focus_time=0
    if [[ -f "${METRICS_DIR}/focus_time.log" ]]; then
        focus_time=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null || echo "0")
        focus_time=$((focus_time * 30)) # 30 seconds per entry
    fi
    
    # Get current flow state
    local flow_state="0"
    if [[ -f "${STATE_DIR}/flow_state" ]]; then
        flow_state=$(cat "${STATE_DIR}/flow_state" 2>/dev/null || echo "0")
    fi
    
    # Get context switches in last hour
    local context_switches=0
    if [[ -f "${METRICS_DIR}/context_switch.log" ]]; then
        context_switches=$(grep -c "^$(date +%Y%m%d_%H)" "${METRICS_DIR}/context_switch.log" 2>/dev/null || echo "0")
    fi
    
    echo "Focus Time Today: $(format_time "${focus_time:-0}")"
    echo "Current Flow State: ${flow_state:0:1}"
    echo "Context Switches (Last Hour): ${context_switches:-0}"
    print_footer
}

show_productivity_metrics() {
    print_section "Productivity Metrics"
    
    # Get latest typing speed
    local typing_speed="0"
    if [[ -f "${METRICS_DIR}/typing_speed.log" ]]; then
        typing_speed=$(tail -n 1 "${METRICS_DIR}/typing_speed.log" 2>/dev/null | awk '{print $2}' || echo "0")
    fi
    
    # Get git changes
    local git_changes="0"
    if [[ -f "${METRICS_DIR}/git_changes.log" ]]; then
        git_changes=$(tail -n 1 "${METRICS_DIR}/git_changes.log" 2>/dev/null | awk '{print $2}' || echo "0")
    fi
    
    # Get active editor sessions
    local editor_sessions="0"
    if [[ -f "${METRICS_DIR}/editor_sessions.log" ]]; then
        editor_sessions=$(tail -n 1 "${METRICS_DIR}/editor_sessions.log" 2>/dev/null | awk '{print $2}' || echo "0")
    fi
    
    echo "Typing Speed: ${typing_speed:-0} keys/min"
    echo "Git Changes: ${git_changes:-0} files"
    echo "Active Editor Sessions: ${editor_sessions:-0}"
    print_footer
}

show_system_metrics() {
    print_section "System Metrics"
    
    # Get latest system load
    local system_load="N/A"
    if [[ -f "${METRICS_DIR}/system_load.log" ]]; then
        system_load=$(tail -n 1 "${METRICS_DIR}/system_load.log" 2>/dev/null | cut -d' ' -f2- || echo "N/A")
    fi
    
    # Get latest memory usage
    local memory_usage="0"
    if [[ -f "${METRICS_DIR}/memory_usage.log" ]]; then
        memory_usage=$(tail -n 1 "${METRICS_DIR}/memory_usage.log" 2>/dev/null | awk '{print $2}' || echo "0")
    fi
    
    echo "System Load: ${system_load:-N/A}"
    echo "Memory Usage: ${memory_usage:-0}%"
    print_footer
}

show_active_files() {
    print_section "Active Files"
    if [[ -f "${METRICS_DIR}/active_files" ]]; then
        tail -n 5 "${METRICS_DIR}/active_files" 2>/dev/null | while read -r file; do
            if [[ -n "$file" ]]; then
                echo "  ${file##*/}"
            fi
        done
    else
        echo "  No active files"
    fi
    print_footer
}

show_recommendations() {
    print_section "ADHD Optimization Recommendations"
    
    local focus_time=0
    if [[ -f "${METRICS_DIR}/focus_time.log" ]]; then
        focus_time=$(grep -c "1$" "${METRICS_DIR}/focus_time.log" 2>/dev/null || echo "0")
        focus_time=$((focus_time * 30))
    fi
    
    local context_switches=0
    if [[ -f "${METRICS_DIR}/context_switch.log" ]]; then
        context_switches=$(grep -c "^$(date +%Y%m%d_%H)" "${METRICS_DIR}/context_switch.log" 2>/dev/null || echo "0")
    fi
    
    if ((focus_time < 1800)); then  # Less than 30 minutes
        echo "→ Consider using the Pomodoro technique (25min focus)"
    fi
    
    if ((context_switches > 10)); then  # More than 10 switches per hour
        echo "→ High context switching - try to focus on one task"
    fi
    
    if [[ -f "${STATE_DIR}/flow_state" ]] && [[ $(cat "${STATE_DIR}/flow_state") == "1" ]]; then
        echo "→ In flow state - maintain focus and avoid interruptions"
    fi
    print_footer
}

# Main display loop
while true; do
    print_header
    show_focus_metrics
    show_productivity_metrics
    show_system_metrics
    show_active_files
    show_recommendations
    sleep 5
done 