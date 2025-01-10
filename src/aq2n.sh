#!/bin/bash

# ADHD-optimized Gauntlet AI focus monitoring
# Based on body doubling, time chunking, and visual feedback

# Color codes for visual distinction
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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
echo -e "${GREEN}🧠 Gauntlet AI Focus Check - $(date +"%H:%M")${NC}"
separator

# Phase tracking
GAUNTLET_START="2024-01-06"
DAYS_IN=$((( $(date +%s) - $(date -d "$GAUNTLET_START" +%s) ) / 86400 ))
WEEK_NUM=$(( $DAYS_IN / 7 + 1 ))
if [ $WEEK_NUM -le 4 ]; then
    PHASE="Remote Phase - Week $WEEK_NUM"
else
    PHASE="Austin Phase - Week $WEEK_NUM"
fi
echo -e "${PURPLE}📅 $PHASE - Day $DAYS_IN of 84${NC}"

# Body double reminder with Gauntlet focus
echo -e "${YELLOW}📱 Focus Environment Check:${NC}"
if [ $((RANDOM % 2)) -eq 0 ]; then
    notify-send "Environment Check" "Are you in a focused space? Consider:\n- Discord study room\n- Body doubling\n- Noise-canceling headphones"
fi

# Hyperfocus check with break enforcement
LAST_BREAK_FILE="/tmp/last_break"
if [ -f "$LAST_BREAK_FILE" ]; then
    LAST_BREAK=$(cat "$LAST_BREAK_FILE")
    TIME_SINCE_BREAK=$(( ($(date +%s) - LAST_BREAK) / 60 ))
    if [ $TIME_SINCE_BREAK -gt 45 ]; then
        notify-send -u critical "🔄 BREAK REQUIRED" "You've been in hyperfocus for $TIME_SINCE_BREAK minutes!\n\n- Stand up\n- Stretch\n- Water break\n- Eye rest"
    fi
fi

# Task switching prompt with Gauntlet context
echo -e "${YELLOW}⏰ Time Block: $CURRENT_BLOCK of $TOTAL_BLOCKS${NC}"
if [ $((RANDOM % 4)) -eq 0 ]; then
    notify-send "Priority Check" "Are you working on:\n- Speed building?\n- AI integration?\n- Core concepts?\n- Practice problems?"
fi

# Expanded distraction check for maximum focus
DISTRACTIONS=(
    "netflix" "youtube" "spotify" "discord" "telegram" "signal" "steam" "game"
    "reddit" "twitter" "facebook" "instagram" "tiktok" "twitch" "chat"
    "news" "shop" "amazon" "ebay" "social" "forum" "blog" "video"
)

echo -e "${RED}🚫 Focus Check:${NC}"
for app in "${DISTRACTIONS[@]}"; do
    if pgrep -i "$app" > /dev/null; then
        notify-send -u critical "⚠️ FOCUS ALERT" "Detected distraction: $app\n\nEvery minute counts for Gauntlet success!"
        echo -e "${RED}⚠️  $app detected!${NC}"
    fi
done

# System resources with Gauntlet context
echo -e "${YELLOW}💻 System Status:${NC}"
FREE_MEM=$(free -h | grep "Mem:" | awk '{print $4}')
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
echo -e "Memory: ${GREEN}$FREE_MEM${NC} free"
echo -e "CPU: ${GREEN}$CPU_USAGE%${NC} used"

# Progress tracking with Gauntlet metrics
echo -e "${GREEN}📊 Today's Progress:${NC}"
COMMITS=$(git log --since="6am" --oneline | wc -l)
echo -e "Git commits: ${GREEN}$COMMITS/3${NC} daily goal"

# Daily note check with template
TODAY=$(date +%Y-%m-%d)
if [ ! -f ~/Documents/notes/$TODAY.md ]; then
    notify-send -u critical "📝 Daily Planning" "Create today's Gauntlet learning log!"
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

# Gauntlet-focused motivation quotes
QUOTES=(
    "Every minute counts. Excellence is the only option."
    "You're here to become the best AI engineer on the planet."
    "Focus leads to mastery. Mastery leads to victory."
    "The Gauntlet is won one focused hour at a time."
    "Your future self will thank you for staying focused now."
    "80-100 hours/week. Make them count."
    "Speed. Precision. Excellence. This is the way."
    "Build faster. Learn deeper. Think clearer."
    "The next great AI builder is forged right here."
    "Transform into the engineer you're meant to be."
)
QUOTE=${QUOTES[$RANDOM % ${#QUOTES[@]}]}
separator
echo -e "${YELLOW}💭 Remember:${NC} $QUOTE"

# Update last activity timestamp
date +%s > "$LAST_BREAK_FILE"

# Schedule next check
if [ $HOURS_WORKED -lt 12 ]; then
    echo -e "${RED}⚠️  Only $HOURS_WORKED hours worked. The Gauntlet demands more!${NC}"
fi

# Weekly progress check
WEEK_COMMITS=$(git log --since="7 days ago" --oneline | wc -l)
echo -e "${CYAN}📈 Week $WEEK_NUM Progress:${NC}"
echo -e "Commits this week: ${GREEN}$WEEK_COMMITS${NC}"

separator 