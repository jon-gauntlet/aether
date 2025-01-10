#!/bin/bash

# Simple Gauntlet Focus Check
# Usage: focus-check [--quiet|-q]
#   --quiet: No notifications, only console output

# Colors (can be disabled by setting NO_COLOR=1)
[[ -z "$NO_COLOR" ]] && {
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
}

# Configuration
DATA_DIR="$HOME/.local/share/gauntlet"
LAST_BREAK_FILE="$DATA_DIR/last_break"
LOG_FILE="$DATA_DIR/$(date +%Y-%m-%d).log"
QUIET_MODE=$([[ "$1" == "--quiet" || "$1" == "-q" ]] && echo 1 || echo 0)

# Optional BrainLift integration
BRAINLIFT_DIR="$HOME/brainlifts"
[[ -d "$BRAINLIFT_DIR" ]] && BRAINLIFT_ENABLED=1

# Notification wrapper
notify() {
    [[ $QUIET_MODE -eq 0 ]] && notify-send "$@"
}

# Show separator
separator() { echo -e "${BLUE}═══════════════════════${NC}"; }

# Check Gauntlet progress
check_progress() {
    # Basic progress tracking
    BLOCKS_TODAY=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
    echo -e "${GREEN}Today's blocks: $BLOCKS_TODAY${NC}"
    
    # Optional BrainLift check
    [[ -n "$BRAINLIFT_ENABLED" ]] && {
        BRAINLIFT_TODAY="$BRAINLIFT_DIR/$(date +%Y-%m-%d).md"
        [[ ! -f "$BRAINLIFT_TODAY" ]] && {
            echo -e "${YELLOW}⚠️  No BrainLift entries today${NC}"
            notify "📝 BrainLift Reminder" "Consider documenting your learning progress"
        }
    }
}

# Check focus environment
check_environment() {
    # Break timer
    if [[ -f "$LAST_BREAK_FILE" ]]; then
        LAST_BREAK=$(cat "$LAST_BREAK_FILE")
        TIME_SINCE_BREAK=$(( ($(date +%s) - LAST_BREAK) / 60 ))
        [[ $TIME_SINCE_BREAK -gt 45 ]] && {
            echo -e "${RED}⚠️  Break needed! ($TIME_SINCE_BREAK minutes since last break)${NC}"
            notify "🔄 Break Required" "Time to stretch and rest your eyes"
        }
    fi
    
    # Common distractions check
    DISTRACTIONS=("youtube" "netflix" "reddit" "twitter" "facebook" "instagram" "tiktok")
    for app in "${DISTRACTIONS[@]}"; do
        pgrep -i "$app" > /dev/null && {
            echo -e "${RED}⚠️  Distraction detected: $app${NC}"
            notify "⚠️ Focus Alert" "Detected: $app\nStay focused on Gauntlet!"
        }
    done
}

# Check system resources
check_system() {
    FREE_MEM=$(free -h | grep "Mem:" | awk '{print $4}')
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
    echo -e "${YELLOW}System Status:${NC}"
    echo -e "Memory: ${GREEN}$FREE_MEM${NC} free"
    echo -e "CPU: ${GREEN}$CPU_USAGE%${NC} used"
}

# Main check routine
main() {
    separator
    echo -e "${GREEN}🎯 Gauntlet Focus Check - $(date +"%H:%M")${NC}"
    separator
    
    check_progress
    check_environment
    check_system
    
    # Update last check time
    date +%s > "$LAST_BREAK_FILE"
    separator
}

# Run main routine
main 