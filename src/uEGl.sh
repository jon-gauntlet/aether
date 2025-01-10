#!/bin/bash

# ADHD-optimized focus monitoring
# Based on the principle of "body doubling" and frequent check-ins

# Color codes for visual distinction
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Visual separator for clear task transitions
function separator() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

# ADHD-friendly time tracking
WORK_START="7:00"
CURRENT_TIME=$(date +%H:%M)
CURRENT_BLOCK=$(($(date +%H) - 7))  # Hour block since start
TOTAL_BLOCKS=16  # 16 hours of potential work time

# Check environment
echo -e "${GREEN}🧠 ADHD Focus Check - $(date +"%H:%M")${NC}"
separator

# Body double reminder
echo -e "${YELLOW}📱 Body Double Status:${NC}"
if [ $((RANDOM % 2)) -eq 0 ]; then
    notify-send "Body Double Check" "Are you in a focused environment? Consider Discord study room."
fi

# Hyperfocus check
LAST_BREAK_FILE="/tmp/last_break"
if [ -f "$LAST_BREAK_FILE" ]; then
    LAST_BREAK=$(cat "$LAST_BREAK_FILE")
    TIME_SINCE_BREAK=$(( ($(date +%s) - LAST_BREAK) / 60 ))
    if [ $TIME_SINCE_BREAK -gt 45 ]; then
        notify-send -u critical "HYPERFOCUS ALERT" "You've been working for $TIME_SINCE_BREAK minutes! Take a break!"
    fi
fi

# Task switching prompt
echo -e "${YELLOW}Current Task Block: $CURRENT_BLOCK of $TOTAL_BLOCKS${NC}"
if [ $((RANDOM % 4)) -eq 0 ]; then
    notify-send "Task Check" "Are you still working on what's most important?"
fi

# Distraction check with expanded list
DISTRACTIONS=(
    "netflix" "youtube" "spotify" "discord" "telegram" "signal" "steam" "game"
    "reddit" "twitter" "facebook" "instagram" "tiktok" "twitch" "chat"
)

echo -e "${RED}🚫 Checking Distractions:${NC}"
for app in "${DISTRACTIONS[@]}"; do
    if pgrep -i "$app" > /dev/null; then
        notify-send -u critical "FOCUS WARNING" "Detected distraction: $app"
        echo -e "${RED}⚠️  $app detected!${NC}"
    fi
done

# System resources with visual indicators
echo -e "${YELLOW}💻 System Status:${NC}"
FREE_MEM=$(free -h | grep "Mem:" | awk '{print $4}')
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
echo -e "Memory: ${GREEN}$FREE_MEM${NC} free"
echo -e "CPU: ${GREEN}$CPU_USAGE%${NC} used"

# Progress tracking
echo -e "${GREEN}📊 Today's Progress:${NC}"
COMMITS=$(git log --since="6am" --oneline | wc -l)
echo -e "Git commits: ${GREEN}$COMMITS${NC} today"

# Daily note check with template
TODAY=$(date +%Y-%m-%d)
if [ ! -f ~/Documents/notes/$TODAY.md ]; then
    notify-send -u critical "📝 Daily Planning" "Create today's note to stay on track!"
    cp ~/Documents/templates/daily.md ~/Documents/notes/$TODAY.md
fi

# Visual progress bar for the day
PROGRESS=$((($CURRENT_BLOCK * 100) / $TOTAL_BLOCKS))
BAR=""
for ((i=0; i<$PROGRESS/5; i++)); do
    BAR+="█"
done
for ((i=$PROGRESS/5; i<20; i++)); do
    BAR+="░"
done
echo -e "${YELLOW}Day Progress: ${GREEN}$PROGRESS%${NC}"
echo -e "${GREEN}$BAR${NC}"

# Motivation quote (Gauntlet-focused)
QUOTES=(
    "Every minute counts. Excellence is the only option."
    "You're here to become the best AI engineer on the planet."
    "Focus leads to mastery. Mastery leads to victory."
    "The Gauntlet is won one focused hour at a time."
    "Your future self will thank you for staying focused now."
)
QUOTE=${QUOTES[$RANDOM % ${#QUOTES[@]}]}
separator
echo -e "${YELLOW}💭 Remember:${NC} $QUOTE"

# Update last activity timestamp
date +%s > "$LAST_BREAK_FILE"

# Schedule next check
if [ $HOURS_WORKED -lt 12 ]; then
    echo -e "${RED}⚠️  Only $HOURS_WORKED hours worked. Keep pushing!${NC}"
fi

separator 