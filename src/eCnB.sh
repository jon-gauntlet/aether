#!/bin/bash

# Only run if script is being executed, not sourced
if [[ -n "$ZSH_EVAL_CONTEXT" && "$ZSH_EVAL_CONTEXT" =~ :file$ ]]; then
    return 0
elif [[ -n "$BASH_VERSION" && "${BASH_SOURCE[0]}" != "${0}" ]]; then
    return 0
fi

# Simple timer that grows with you
# Try: gt        # Quick 25min focus block
#      gt help   # Show more options

# Colors (disabled with NO_COLOR=1)
[[ -z "$NO_COLOR" ]] && {
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
}

# Show help if requested
show_help() {
    cat << EOF
Usage: gt [time] [break] [options]

Quick Start:
  gt         25min focus, 5min break
  gt 45      45min focus, 5min break
  gt 25 10   25min focus, 10min break

Fun Options:
  gt mini    Minimal display mode
  gt zen     No notifications/colors
  gt fun     Emoji and celebrations

Tips shown after completing blocks!
EOF
    exit 0
}

[[ "$1" == "help" ]] && show_help

# Handle convenience modes
case "$1" in
    mini|minimal) MINIMAL=1; shift ;;
    zen) NO_COLOR=1; NO_NOTIFY=1; shift ;;
    fun) EMOJI=1; shift ;;
esac

# Basic setup
WORK_MINUTES=${1:-25}
BREAK_MINUTES=${2:-5}
DATA_DIR="$HOME/.local/share/gauntlet"
LOG_FILE="$DATA_DIR/$(date +%Y-%m-%d).log"
mkdir -p "$DATA_DIR" && touch "$LOG_FILE"

# Optional notification wrapper
notify() { [[ -z "$NO_NOTIFY" ]] && notify-send "$@"; }

# Simple display
show_timer() {
    [[ -z "$NO_CLEAR" ]] && clear
    [[ -n "$MINIMAL" ]] && { echo -e "${GREEN}$1:$2${NC} $TASK"; return; }
    
    echo -e "${BLUE}═══════════════════════${NC}"
    echo -e "${YELLOW}Task:${NC} $TASK"
    echo -e "${GREEN}Time:${NC} $1:$2"
    [[ -n "$EMOJI" ]] && {
        case $1 in
            [0-4]) echo "🎯 Final push!" ;;
            [5-9]) echo "💪 Keep going!" ;;
            1[0-4]) echo "🚀 Halfway!" ;;
            *) echo "🎮 Focus mode" ;;
        esac
    }
}

# Get task (with smart defaults)
echo -e "${YELLOW}Task? (Enter for 'Focus Time')${NC}"
read -r TASK
[[ -z "$TASK" ]] && TASK="Focus Time"

# Main timer
echo -e "${GREEN}Starting ${WORK_MINUTES}min block${NC}"
notify "🎯 Focus Time" "$TASK - ${WORK_MINUTES}min"

END=$(($(date +%s) + WORK_MINUTES * 60))
while [ $(date +%s) -lt $END ]; do
    REMAINING=$((END - $(date +%s)))
    MIN=$((REMAINING / 60))
    SEC=$((REMAINING % 60))
    [[ $SEC -lt 10 ]] && SEC="0$SEC"
    show_timer $MIN $SEC
    sleep 1
done

# Log and complete
echo "$(date +"%H:%M") - $TASK" >> "$LOG_FILE"
notify "✅ Done!" "$TASK completed"

# Break if requested
[[ $BREAK_MINUTES -gt 0 ]] && {
    echo -e "\n${GREEN}Break: $BREAK_MINUTES minutes${NC}"
    notify "🔄 Break" "$BREAK_MINUTES minutes\n- Stretch\n- Water\n- Rest eyes"
    sleep ${BREAK_MINUTES}m
    notify "🎯 Ready?" "Break complete"
}

# Show progress and random tip
BLOCKS=$(wc -l < "$LOG_FILE")
echo -e "\n${GREEN}Today: $BLOCKS blocks${NC}"

# Random tips for discovery
TIPS=(
    "Try 'gt fun' for emoji mode!"
    "Try 'gt mini' for minimal display"
    "Try 'gt zen' for zero distractions"
    "Use 'gt help' to see all options"
)
[[ $((RANDOM % 3)) -eq 0 ]] && echo -e "\n${BLUE}Tip:${NC} ${TIPS[$((RANDOM % ${#TIPS[@]}))]}"

# Quick continue
echo -e "\n${YELLOW}Another block? [Y/n]${NC}"
read -r -n 1 CONTINUE
[[ ${CONTINUE,,} != "n" ]] && exec $0 $@ 