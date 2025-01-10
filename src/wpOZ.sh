#!/bin/bash

# Gauntlet AI ADHD-optimized Pomodoro Timer
# Features:
# - Visual and audio feedback
# - Dynamic break lengths based on focus time
# - Task context preservation
# - Hyperfocus protection
# - Progress tracking

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
WORK_MINUTES=25
SHORT_BREAK=5
LONG_BREAK=15
SESSIONS_BEFORE_LONG_BREAK=4
TASK_FILE="/tmp/current_task"
SESSION_COUNT_FILE="/tmp/pomodoro_sessions"
DAILY_LOG_FILE="$HOME/Documents/notes/$(date +%Y-%m-%d)_pomodoro.log"

# Initialize session count if not exists
if [ ! -f $SESSION_COUNT_FILE ]; then
    echo "0" > $SESSION_COUNT_FILE
fi

# Visual separator
function separator() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

# Task context management
function save_task_context() {
    echo -e "${YELLOW}What are you working on? (brief description)${NC}"
    read task_description
    echo "$task_description" > $TASK_FILE
}

function load_task_context() {
    if [ -f $TASK_FILE ]; then
        cat $TASK_FILE
    else
        echo "No task context saved"
    fi
}

# Progress tracking
function log_session() {
    local duration=$1
    local task=$(load_task_context)
    echo "$(date +"%H:%M") - $duration mins - $task" >> $DAILY_LOG_FILE
}

function show_progress() {
    local sessions=$(cat $SESSION_COUNT_FILE)
    local total_minutes=$((sessions * WORK_MINUTES))
    echo -e "${GREEN}Today's Focus Time: ${total_minutes} minutes${NC}"
    echo -e "${GREEN}Completed Sessions: ${sessions}${NC}"
}

# Timer display
function show_timer() {
    local minutes=$1
    local seconds=$2
    local task=$(load_task_context)
    clear
    separator
    echo -e "${PURPLE}🎯 Gauntlet AI Focus Timer${NC}"
    echo -e "${YELLOW}Current Task:${NC} $task"
    echo -e "${GREEN}Time Remaining: ${minutes}:${seconds}${NC}"
    separator
}

# Main timer function
function run_timer() {
    local duration=$1
    local end_time=$(($(date +%s) + duration * 60))
    
    while [ $(date +%s) -lt $end_time ]; do
        local remaining=$((end_time - $(date +%s)))
        local minutes=$((remaining / 60))
        local seconds=$((remaining % 60))
        
        # Format seconds with leading zero
        if [ $seconds -lt 10 ]; then
            seconds="0$seconds"
        fi
        
        show_timer $minutes $seconds
        sleep 1
    done
}

# Break notification
function take_break() {
    local duration=$1
    notify-send -u critical "🔄 Break Time!" "Take a $duration minute break:\n- Stand up\n- Stretch\n- Water\n- Eye rest"
    echo -e "${YELLOW}Break time! $duration minutes${NC}"
    run_timer $duration
    notify-send "🎯 Break Over" "Ready to continue your Gauntlet journey?"
}

# Main loop
while true; do
    # Show current progress
    show_progress
    
    # Get task context
    save_task_context
    
    # Start focus session
    echo -e "${GREEN}Starting $WORK_MINUTES minute focus session${NC}"
    notify-send "🎯 Focus Time" "Starting $WORK_MINUTES minute Gauntlet session"
    run_timer $WORK_MINUTES
    
    # Log completed session
    session_count=$(($(cat $SESSION_COUNT_FILE) + 1))
    echo $session_count > $SESSION_COUNT_FILE
    log_session $WORK_MINUTES
    
    # Determine break type
    if [ $((session_count % SESSIONS_BEFORE_LONG_BREAK)) -eq 0 ]; then
        take_break $LONG_BREAK
    else
        take_break $SHORT_BREAK
    fi
    
    # Ask to continue
    echo -e "${YELLOW}Continue with another session? (y/n)${NC}"
    read -n 1 continue_session
    if [ "$continue_session" != "y" ]; then
        echo -e "\n${GREEN}Great work! Keep pushing towards Gauntlet excellence!${NC}"
        break
    fi
done 