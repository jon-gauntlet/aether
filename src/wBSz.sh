#!/bin/bash

# ADHD-optimized Gauntlet AI focus monitoring
# Integrated with Block system and BrainLift tracking

# Color codes for visual distinction
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# File paths
WORKSPACE_DIR="$HOME/workspace/gauntlet"
DATA_DIR="$WORKSPACE_DIR/data"
BRAINLIFT_DIR="$WORKSPACE_DIR/brainlifts"
mkdir -p "$DATA_DIR" "$BRAINLIFT_DIR"

LAST_BREAK_FILE="$DATA_DIR/last_break"
DAILY_LOG="$DATA_DIR/$(date +%Y-%m-%d)_blocks.log"
WEEKLY_LOG="$DATA_DIR/$(date +%Y-W%V)_weekly.log"
BRAINLIFT_LOG="$DATA_DIR/brainlift_updates.log"

# Visual separator for clear task transitions
function separator() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

# ADHD-friendly time tracking
WORK_START="7:00"
CURRENT_TIME=$(date +%H:%M)
CURRENT_BLOCK=$(($(date +%H) - 7))  # Hour block since start
TOTAL_BLOCKS=16  # 16 hours of potential work time

# Gauntlet phase tracking
GAUNTLET_START="2024-01-06"
DAYS_IN=$((( $(date +%s) - $(date -d "$GAUNTLET_START" +%s) ) / 86400 ))
WEEK_NUM=$(( $DAYS_IN / 7 + 1 ))
PHASE="Remote Phase"
[[ $WEEK_NUM -gt 4 ]] && PHASE="Austin Phase"

# Check environment
echo -e "${GREEN}🧠 Gauntlet AI Focus Check - $(date +"%H:%M")${NC}"
separator

# Phase and progress tracking
echo -e "${PURPLE}📅 $PHASE - Week $WEEK_NUM - Day $DAYS_IN of 84${NC}"

# Block progress tracking
BLOCKS_TODAY=$(grep "Block completed" "$DAILY_LOG" 2>/dev/null | wc -l)
BLOCKS_THIS_WEEK=$(awk '{sum += $1} END {print sum}' "$WEEKLY_LOG" 2>/dev/null || echo "0")
BLOCKS_NEEDED=$(( 80 - BLOCKS_THIS_WEEK ))

echo -e "${YELLOW}📊 Block Progress:${NC}"
echo -e "Today: ${GREEN}$BLOCKS_TODAY${NC} blocks"
echo -e "This week: ${GREEN}$BLOCKS_THIS_WEEK${NC}/80 blocks"
echo -e "Remaining for 80hr goal: ${RED}$BLOCKS_NEEDED${NC} blocks"

# Visual progress bar
WEEKLY_PERCENT=$((BLOCKS_THIS_WEEK * 100 / 80))
BAR=""
for ((i=0; i<WEEKLY_PERCENT/5; i++)); do
    BAR+="█"
done
for ((i=WEEKLY_PERCENT/5; i<20; i++)); do
    BAR+="░"
done
echo -e "Weekly progress: ${GREEN}$BAR${NC} ($WEEKLY_PERCENT%)"

# BrainLift check
BRAINLIFT_TODAY="$BRAINLIFT_DIR/$(date +%Y-%m-%d)_brainlift.md"
if [[ ! -f "$BRAINLIFT_TODAY" ]]; then
    notify-send -u critical "📝 BrainLift Missing" "Create today's BrainLift to track your learning!"
fi

# Body double reminder with Gauntlet focus
echo -e "${YELLOW}📱 Focus Environment Check:${NC}"
if [ $((RANDOM % 2)) -eq 0 ]; then
    notify-send "Environment Check" "Are you in a focused space? Consider:\n- Discord study room\n- Body doubling\n- Noise-canceling headphones"
fi

# Hyperfocus check with break enforcement
if [ -f "$LAST_BREAK_FILE" ]; then
    LAST_BREAK=$(cat "$LAST_BREAK_FILE")
    TIME_SINCE_BREAK=$(( ($(date +%s) - LAST_BREAK) / 60 ))
    if [ $TIME_SINCE_BREAK -gt 45 ]; then
        notify-send -u critical "🔄 BREAK REQUIRED" "You've been in hyperfocus for $TIME_SINCE_BREAK minutes!\n\n- Stand up\n- Stretch\n- Water break\n- Eye rest"
    fi
fi

# Expanded distraction check
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

# Gauntlet-focused motivation quotes
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
QUOTE=${QUOTES[$RANDOM % ${#QUOTES[@]}]}
separator
echo -e "${YELLOW}💭 Remember:${NC} $QUOTE"

# Update last activity timestamp
date +%s > "$LAST_BREAK_FILE"

# Weekly progress check
WEEK_COMMITS=$(git log --since="7 days ago" --oneline | wc -l)
echo -e "${CYAN}📈 Week $WEEK_NUM Progress:${NC}"
echo -e "Commits this week: ${GREEN}$WEEK_COMMITS${NC}"

# BrainLift reminder
echo -e "${PURPLE}📚 BrainLift Status:${NC}"
BRAINLIFT_ENTRIES=$(grep -c "^###" "$BRAINLIFT_TODAY" 2>/dev/null || echo "0")
echo -e "Today's entries: ${GREEN}$BRAINLIFT_ENTRIES${NC}"

separator 