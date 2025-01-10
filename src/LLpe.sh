#!/usr/bin/env zsh

# Brain Gains - Learning Optimization System
# Tracks, analyzes, and optimizes learning activities
# Integrates with timer for spaced repetition

# Exit if being sourced
[[ $ZSH_EVAL_CONTEXT == *:file:* ]] && return 0

# Colors
[[ -z "$NO_COLOR" ]] && {
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    RED='\033[0;31m'
    NC='\033[0m'
}

# Data storage
DATA_DIR="$HOME/.local/share/gauntlet/learning"
TOPICS_FILE="$DATA_DIR/topics.json"
SESSIONS_FILE="$DATA_DIR/sessions.json"
INSIGHTS_FILE="$DATA_DIR/insights.md"
mkdir -p "$DATA_DIR"

# Initialize files if needed
[[ -f $TOPICS_FILE ]] || echo '{}' > "$TOPICS_FILE"
[[ -f $SESSIONS_FILE ]] || echo '[]' > "$SESSIONS_FILE"
[[ -f $INSIGHTS_FILE ]] || touch "$INSIGHTS_FILE"

# Show help
show_help() {
    cat << EOF
Brain Gains - Learning Optimization

Quick Start:
  bg learn <topic>     Start learning session
  bg note "<text>"     Quick insight capture
  bg review           Review recent learnings
  bg stats            Learning analytics
  bg next             Suggest next topic

Learning Modes:
  bg deep <topic>     Deep dive session
  bg quick <topic>    Quick refresh
  bg connect         Find topic connections
  bg gaps            Knowledge gap analysis

Insights:
  bg search <term>    Search your insights
  bg export          Export learning data
  bg import          Import external notes

Tips shown after sessions!
EOF
    exit 0
}

# Record a learning session
record_session() {
    local topic=$1
    local duration=$2
    local notes=$3
    local timestamp=$(date +%s)
    
    # Update topics
    local topics=$(cat "$TOPICS_FILE")
    if echo "$topics" | jq -e ".\"$topic\"" >/dev/null; then
        # Update existing topic
        topics=$(echo "$topics" | jq ".\"$topic\".sessions += 1 | .\"$topic\".last = $timestamp")
    else
        # Add new topic
        topics=$(echo "$topics" | jq ". + {\"$topic\": {\"sessions\": 1, \"first\": $timestamp, \"last\": $timestamp}}")
    fi
    echo "$topics" > "$TOPICS_FILE"
    
    # Add session
    local sessions=$(cat "$SESSIONS_FILE")
    sessions=$(echo "$sessions" | jq ". + [{\"topic\": \"$topic\", \"duration\": $duration, \"timestamp\": $timestamp, \"notes\": \"$notes\"}]")
    echo "$sessions" > "$SESSIONS_FILE"
}

# Capture quick insight
capture_insight() {
    local note=$1
    local timestamp=$(date +%Y-%m-%d\ %H:%M)
    echo -e "\n## $timestamp\n$note" >> "$INSIGHTS_FILE"
    echo -e "${GREEN}✓ Insight captured${NC}"
}

# Analyze learning patterns
show_stats() {
    echo -e "\n${BLUE}Learning Analytics:${NC}"
    
    # Calculate stats
    local topics=$(cat "$TOPICS_FILE")
    local total=$(echo "$topics" | jq 'length')
    local active=$(echo "$topics" | jq '[.[] | select(.last >= now - 604800)] | length')
    local sessions=$(cat "$SESSIONS_FILE")
    local recent=$(echo "$sessions" | jq '[.[] | select(.timestamp >= now - 86400)] | length')
    
    echo -e "${YELLOW}Topics:${NC} $total total, $active active this week"
    echo -e "${YELLOW}Sessions:${NC} $recent today"
    
    # Show top topics
    echo -e "\n${BLUE}Most Studied:${NC}"
    echo "$topics" | jq -r 'to_entries | sort_by(.value.sessions) | reverse | .[0:5] | .[] | "- \(.key): \(.value.sessions) sessions"'
    
    # Show learning streaks
    echo -e "\n${BLUE}Learning Streaks:${NC}"
    local prev_day=0
    local streak=0
    echo "$sessions" | jq -r '.[] | .timestamp' | sort -n | while read -r ts; do
        day=$(( ts / 86400 ))
        if [[ $((day - prev_day)) -eq 1 ]]; then
            ((streak++))
        elif [[ $((day - prev_day)) -gt 1 ]]; then
            streak=0
        fi
        prev_day=$day
    done
    echo "Current streak: $streak days"
}

# Suggest next topic
suggest_next() {
    echo -e "\n${BLUE}Suggested Topics:${NC}"
    
    # Find topics needing review
    local topics=$(cat "$TOPICS_FILE")
    local now=$(date +%s)
    
    # Use spaced repetition intervals
    echo "$topics" | jq -r --arg now "$now" '
        to_entries[] | 
        select(
            (.value.last | tonumber) <= ($now | tonumber) - 86400 * (
                if .value.sessions == 1 then 1    # Review after 1 day
                elif .value.sessions == 2 then 3  # Review after 3 days
                elif .value.sessions == 3 then 7  # Review after 1 week
                elif .value.sessions == 4 then 14 # Review after 2 weeks
                else 30                          # Review after 1 month
                end
            )
        ) |
        "- \(.key) (last: \(.value.last | strftime(\"%Y-%m-%d\")))"
    '
}

# Start learning session
start_session() {
    local topic=$1
    local mode=${2:-normal}
    
    case $mode in
        deep)
            duration=45
            echo -e "${BLUE}Starting deep dive on:${NC} $topic"
            ;;
        quick)
            duration=15
            echo -e "${BLUE}Quick refresh on:${NC} $topic"
            ;;
        *)
            duration=25
            echo -e "${BLUE}Learning session:${NC} $topic"
            ;;
    esac
    
    # Start timer
    gt $duration
    
    # Capture notes
    echo -e "\n${YELLOW}Quick notes? (Enter to skip)${NC}"
    read -r notes
    
    # Record session
    record_session "$topic" $duration "${notes:-No notes}"
    
    # Show tips
    echo -e "\n${GREEN}Session complete!${NC}"
    echo -e "${BLUE}Tips:${NC}"
    echo "- Try 'bg connect' to find related topics"
    echo "- Use 'bg note' to capture insights"
    echo "- Check 'bg stats' to track progress"
}

# Handle commands
case $1 in
    help|--help|-h) show_help ;;
    learn) shift; start_session "$@" ;;
    deep) shift; start_session "$1" deep ;;
    quick) shift; start_session "$1" quick ;;
    note) shift; capture_insight "$*" ;;
    stats) show_stats ;;
    next) suggest_next ;;
    *) show_help ;;
esac 