#!/bin/bash

# Quick focus check that grows with you
# Try: gf        # Quick focus check
#      gf help   # Show more options

# Colors (disabled with NO_COLOR=1)
[[ -z "$NO_COLOR" ]] && {
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
}

# Show help if requested
show_help() {
    cat << EOF
Usage: gf [options]

Quick Start:
  gf         Quick focus check
  gf quiet   Silent check (no notifications)
  gf mini    Minimal display

Fun Options:
  gf watch   Monitor focus every 30min
  gf zen     No colors/notifications
  gf stats   Show focus stats

Tips shown after checks!
EOF
    exit 0
}

[[ "$1" == "help" ]] && show_help

# Handle convenience modes
case "$1" in
    quiet|q) QUIET=1 ;;
    mini|minimal) MINIMAL=1 ;;
    zen) NO_COLOR=1; QUIET=1 ;;
    watch) WATCH=1 ;;
    stats) STATS=1 ;;
esac

# Basic setup
DATA_DIR="$HOME/.local/share/gauntlet"
LOG_FILE="$DATA_DIR/$(date +%Y-%m-%d).log"
LAST_BREAK="$DATA_DIR/last_break"
mkdir -p "$DATA_DIR"

# Optional notification wrapper
notify() { [[ -z "$QUIET" ]] && notify-send "$@"; }

# Show separator unless minimal
separator() { [[ -z "$MINIMAL" ]] && echo -e "${BLUE}═══════════════════════${NC}"; }

# Check focus status
check_focus() {
    separator
    [[ -z "$MINIMAL" ]] && echo -e "${GREEN}🎯 Focus Check - $(date +"%H:%M")${NC}"
    
    # Break timer
    if [[ -f "$LAST_BREAK" ]]; then
        MINS=$(( ($(date +%s) - $(cat "$LAST_BREAK")) / 60 ))
        [[ $MINS -gt 45 ]] && {
            echo -e "${RED}⚠️  Break needed! ($MINS min)${NC}"
            notify "🔄 Break Required" "Time to stretch and rest"
        }
    fi
    
    # Block progress
    BLOCKS=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
    echo -e "${GREEN}Today: $BLOCKS blocks${NC}"
    
    # Quick distraction check
    for app in youtube netflix reddit twitter facebook tiktok; do
        pgrep -i "$app" > /dev/null && {
            echo -e "${RED}⚠️  Found: $app${NC}"
            notify "⚠️ Focus Alert" "Detected: $app"
        }
    done
    
    # System check
    [[ -z "$MINIMAL" ]] && {
        MEM=$(free -h | awk '/^Mem:/ {print $4}')
        CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
        echo -e "${YELLOW}Memory: ${GREEN}$MEM${NC} free"
        echo -e "${YELLOW}CPU: ${GREEN}$CPU%${NC} used"
    }
    
    separator
}

# Show stats if requested
show_stats() {
    echo -e "\n${BLUE}Focus Stats:${NC}"
    echo "Last 7 days:"
    for i in {6..0}; do
        DATE=$(date -d "$i days ago" +%Y-%m-%d)
        FILE="$DATA_DIR/$DATE.log"
        BLOCKS=$(wc -l < "$FILE" 2>/dev/null || echo 0)
        DAY=$(date -d "$DATE" +%a)
        echo -e "${YELLOW}$DAY:${NC} $BLOCKS blocks"
    done
    exit 0
}

[[ -n "$STATS" ]] && show_stats

# Main check
check_focus

# Update break timer
date +%s > "$LAST_BREAK"

# Show random tip (33% chance)
TIPS=(
    "Try 'gf watch' for periodic checks"
    "Try 'gf mini' for minimal display"
    "Try 'gf stats' to see your progress"
    "Use 'gf help' to see all options"
    "Combine with 'gt' for optimal focus"
)
[[ $((RANDOM % 3)) -eq 0 ]] && echo -e "\n${BLUE}Tip:${NC} ${TIPS[$((RANDOM % ${#TIPS[@]}))]}"

# Watch mode
[[ -n "$WATCH" ]] && {
    echo -e "\n${YELLOW}Watching focus every 30min. Ctrl+C to stop.${NC}"
    while true; do
        sleep 1800  # 30 minutes
        check_focus
    done
} 