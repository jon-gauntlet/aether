#!/bin/bash

# Gauntlet AI ADHD-optimized Block Timer
# Features:
# - Block-based work tracking (25-minute focused sessions)
# - BrainLift integration
# - Visual and audio feedback
# - ADHD-friendly progress tracking
# - Gauntlet metrics monitoring

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
WORK_MINUTES=25
SHORT_BREAK=5
LONG_BREAK=15
SESSIONS_BEFORE_LONG_BREAK=4
DAILY_GOAL=16  # 16 blocks = ~8 productive hours
WEEKLY_GOAL=80  # 80 blocks = ~40 productive hours

# File paths
WORKSPACE_DIR="$HOME/workspace/gauntlet"
DATA_DIR="$WORKSPACE_DIR/data"
BRAINLIFT_DIR="$WORKSPACE_DIR/brainlifts"
mkdir -p "$DATA_DIR" "$BRAINLIFT_DIR"

TASK_FILE="$DATA_DIR/current_task"
SESSION_COUNT_FILE="$DATA_DIR/pomodoro_sessions"
DAILY_LOG_FILE="$DATA_DIR/$(date +%Y-%m-%d)_blocks.log"
WEEKLY_LOG_FILE="$DATA_DIR/$(date +%Y-W%V)_weekly.log"
BRAINLIFT_LOG="$DATA_DIR/brainlift_updates.log"

# Initialize session count if not exists
[[ ! -f $SESSION_COUNT_FILE ]] && echo "0" > $SESSION_COUNT_FILE

# Visual separator with Gauntlet context
function separator() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${PURPLE}🎯 Gauntlet AI - Building Excellence${NC}"
    separator
}

# BrainLift integration
function update_brainlift() {
    local task=$1
    local notes=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $task: $notes" >> "$BRAINLIFT_LOG"
    
    # Create/update BrainLift entry
    local brainlift_file="$BRAINLIFT_DIR/$(date +%Y-%m-%d)_brainlift.md"
    if [[ ! -f $brainlift_file ]]; then
        echo "# BrainLift - $(date +%Y-%m-%d)" > "$brainlift_file"
        echo "## Tasks and Insights" >> "$brainlift_file"
    fi
    echo "### $task" >> "$brainlift_file"
    echo "- $notes" >> "$brainlift_file"
    echo "- Time spent: 25 minutes" >> "$brainlift_file"
    echo "" >> "$brainlift_file"
}

# Enhanced task context management
function save_task_context() {
    echo -e "${YELLOW}What are you working on? (brief description)${NC}"
    read task_description
    echo -e "${CYAN}Any specific goals/outcomes for this block?${NC}"
    read goals
    echo -e "${CYAN}BrainLift notes (optional):${NC}"
    read notes
    
    echo "$task_description" > "$TASK_FILE"
    [[ ! -z "$notes" ]] && update_brainlift "$task_description" "$notes"
}

# Progress visualization
function show_progress() {
    local sessions=$(cat "$SESSION_COUNT_FILE")
    local total_minutes=$((sessions * WORK_MINUTES))
    local daily_percent=$((sessions * 100 / DAILY_GOAL))
    
    echo -e "\n${GREEN}Today's Progress:${NC}"
    echo -e "Blocks: $sessions/$DAILY_GOAL ($daily_percent%)"
    echo -e "Focus Time: ${total_minutes} minutes"
    
    # Visual progress bar
    local bar=""
    for ((i=0; i<daily_percent/5; i++)); do
        bar+="█"
    done
    for ((i=daily_percent/5; i<20; i++)); do
        bar+="░"
    done
    echo -e "${GREEN}$bar${NC}"
    
    # Weekly progress
    local weekly_blocks=$(awk '{sum += $1} END {print sum}' "$WEEKLY_LOG_FILE" 2>/dev/null || echo "0")
    local weekly_percent=$((weekly_blocks * 100 / WEEKLY_GOAL))
    echo -e "\n${CYAN}Weekly Progress: $weekly_blocks/$WEEKLY_GOAL blocks ($weekly_percent%)${NC}"
}

# ADHD-optimized timer display
function show_timer() {
    local minutes=$1
    local seconds=$2
    local task=$(cat "$TASK_FILE")
    clear
    separator
    echo -e "${YELLOW}Current Task:${NC} $task"
    echo -e "${GREEN}Time Remaining: ${BOLD}${minutes}:${seconds}${NC}"
    echo -e "${CYAN}Focus Tips:${NC}"
    echo -e "- Stay on task"
    echo -e "- No distractions"
    echo -e "- Build excellence"
    separator
}

# Enhanced break notification
function take_break() {
    local duration=$1
    notify-send -u critical "🔄 Break Time!" "Take a $duration minute break:\n- Stand up\n- Stretch\n- Water\n- Eye rest"
    
    # ADHD-friendly break timer
    echo -e "${YELLOW}Break time! $duration minutes${NC}"
    for ((i=duration; i>0; i--)); do
        echo -ne "${GREEN}$i minutes remaining...${NC}\r"
        sleep 60
    done
    notify-send "🎯 Break Over" "Ready to continue your Gauntlet journey?"
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
        [[ $seconds -lt 10 ]] && seconds="0$seconds"
        
        show_timer $minutes $seconds
        sleep 1
    done
}

# Log completion
function log_session() {
    local task=$(cat "$TASK_FILE")
    echo "$(date +"%H:%M") - Block completed: $task" >> "$DAILY_LOG_FILE"
    echo "1" >> "$WEEKLY_LOG_FILE"
}

# Gauntlet motivation quotes
QUOTES=(
    "Excellence is the only option."
    "You're here to become the best AI engineer on the planet."
    "Focus leads to mastery. Mastery leads to victory."
    "The Gauntlet is won one focused block at a time."
    "80-100 hours/week. Make them count."
    "Speed. Precision. Excellence. This is the way."
    "Build faster. Learn deeper. Think clearer."
    "Transform into the engineer you're meant to be."
)

# Main loop
while true; do
    # Show current progress
    show_progress
    
    # Display random motivation
    echo -e "\n${YELLOW}💭 ${QUOTES[$RANDOM % ${#QUOTES[@]}]}${NC}\n"
    
    # Get task context
    save_task_context
    
    # Start focus session
    echo -e "${GREEN}Starting $WORK_MINUTES minute block${NC}"
    notify-send "🎯 Focus Time" "Starting $WORK_MINUTES minute Gauntlet block"
    run_timer $WORK_MINUTES
    
    # Log completed block
    session_count=$(($(cat "$SESSION_COUNT_FILE") + 1))
    echo $session_count > "$SESSION_COUNT_FILE"
    log_session
    
    # Break logic
    if [ $((session_count % SESSIONS_BEFORE_LONG_BREAK)) -eq 0 ]; then
        take_break $LONG_BREAK
    else
        take_break $SHORT_BREAK
    fi
    
    # Continue prompt
    echo -e "${YELLOW}Continue with another block? (y/n)${NC}"
    read -n 1 continue_session
    if [ "$continue_session" != "y" ]; then
        echo -e "\n${GREEN}Great work! Keep pushing towards Gauntlet excellence!${NC}"
        break
    fi
done 