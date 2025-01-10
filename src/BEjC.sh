#!/bin/bash

# Simple Gauntlet Block Timer
# Usage: gtimer [minutes] [break-minutes]
#   Default: 25 minute blocks, 5 minute breaks
#   Examples: 
#     gtimer         # 25min block, 5min break
#     gtimer 45      # 45min block, 5min break
#     gtimer 25 10   # 25min block, 10min break

# Colors (can be disabled by setting NO_COLOR=1)
[[ -z "$NO_COLOR" ]] && {
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
}

# Simple configuration
WORK_MINUTES=${1:-25}
BREAK_MINUTES=${2:-5}
DATA_DIR="$HOME/.local/share/gauntlet"
mkdir -p "$DATA_DIR"

# Today's log file for tracking
LOG_FILE="$DATA_DIR/$(date +%Y-%m-%d).log"
touch "$LOG_FILE"

# Optional BrainLift integration
BRAINLIFT_DIR="$HOME/brainlifts"
[[ -d "$BRAINLIFT_DIR" ]] && BRAINLIFT_ENABLED=1

# Show simple separator
separator() { echo -e "${BLUE}═══════════════════════${NC}"; }

# Display timer with task
show_timer() {
    clear
    separator
    echo -e "${YELLOW}Current Task:${NC} $TASK"
    echo -e "${GREEN}Time: $1:$2${NC}"
    [[ $1 -lt 5 ]] && echo "🎯 Final stretch!"
    separator
}

# Log completed block
log_block() {
    echo "$(date +"%H:%M") - $TASK" >> "$LOG_FILE"
    
    # Optional BrainLift update if enabled and notes provided
    [[ -n "$BRAINLIFT_ENABLED" && -n "$NOTES" ]] && {
        local bl_file="$BRAINLIFT_DIR/$(date +%Y-%m-%d).md"
        echo -e "\n### $TASK\n- $NOTES\n- Time: ${WORK_MINUTES}min" >> "$bl_file"
    }
}

# Get task info
echo -e "${YELLOW}What are you working on?${NC}"
read -r TASK

# Optional BrainLift notes
[[ -n "$BRAINLIFT_ENABLED" ]] && {
    echo -e "${YELLOW}Notes for BrainLift? (optional)${NC}"
    read -r NOTES
}

# Start focus block
echo -e "${GREEN}Starting ${WORK_MINUTES}-minute block${NC}"
notify-send "🎯 Focus Time" "$TASK - ${WORK_MINUTES} minutes"

# Main timer
END=$(($(date +%s) + WORK_MINUTES * 60))
while [ $(date +%s) -lt $END ]; do
    REMAINING=$((END - $(date +%s)))
    MIN=$((REMAINING / 60))
    SEC=$((REMAINING % 60))
    [[ $SEC -lt 10 ]] && SEC="0$SEC"
    show_timer $MIN $SEC
    sleep 1
done

# Block complete
notify-send "✅ Block Complete!" "$TASK finished"
log_block

# Break timer (if break minutes > 0)
[[ $BREAK_MINUTES -gt 0 ]] && {
    echo -e "\n${GREEN}Break time: $BREAK_MINUTES minutes${NC}"
    notify-send "🔄 Break Time" "$BREAK_MINUTES minutes\n- Stand & stretch\n- Water\n- Eyes rest"
    sleep ${BREAK_MINUTES}m
    notify-send "🎯 Break Over" "Ready for next block?"
}

# Show daily progress
BLOCKS_TODAY=$(wc -l < "$LOG_FILE")
echo -e "\n${GREEN}Today's blocks: $BLOCKS_TODAY${NC}"

# Simple continuation prompt
echo -e "\n${YELLOW}Start another block? [Y/n]${NC}"
read -r -n 1 CONTINUE
[[ ${CONTINUE,,} != "n" ]] && exec $0 $@ 