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

Focus Modes:
  gf flow    Optimize for hyperfocus
  gf deep    Deep work setup
  gf zen     Zero distractions

Analysis:
  gf stats   Show focus patterns
  gf watch   Monitor every 30min
  gf when    Best focus times

Tips shown after checks!
EOF
    exit 0
}

[[ "$1" == "help" ]] && show_help

# Handle focus modes
case "$1" in
    quiet|q) QUIET=1 ;;
    mini|minimal) MINIMAL=1 ;;
    zen) NO_COLOR=1; QUIET=1 ;;
    flow) FLOW=1 ;;
    deep) DEEP=1 ;;
    watch) WATCH=1 ;;
    stats) STATS=1 ;;
    when) WHEN=1 ;;
esac

# Basic setup
DATA_DIR="$HOME/.local/share/gauntlet"
LOG_FILE="$DATA_DIR/$(date +%Y-%m-%d).log"
LAST_BREAK="$DATA_DIR/last_break"
FLOW_STATE="$DATA_DIR/flow_state"
mkdir -p "$DATA_DIR"

# Optional notification wrapper
notify() { [[ -z "$QUIET" ]] && notify-send "$@"; }

# Show separator unless minimal
separator() { [[ -z "$MINIMAL" ]] && echo -e "${BLUE}═══════════════════════${NC}"; }

# Prepare environment for hyperfocus
prepare_flow() {
    # Check ideal conditions
    echo -e "\n${BLUE}Optimizing for flow state:${NC}"
    
    # Environment checks
    LIGHT=$(xbacklight 2>/dev/null || echo "?")
    AUDIO=$(pactl list sinks | grep "Volume:" | head -n 1 | awk '{print $5}')
    
    echo -e "Environment:"
    [[ "$LIGHT" != "?" && "$LIGHT" -gt 70 ]] && echo "- Consider lowering screen brightness"
    [[ "$AUDIO" != "0%" ]] && echo "- Consider muting or using white noise"
    
    # Process checks
    DISTRACTIONS=0
    for app in slack discord telegram signal; do
        pgrep -i "$app" > /dev/null && {
            echo "- Consider closing: $app"
            ((DISTRACTIONS++))
        }
    done
    
    # Browser tabs check
    if command -v firefox >/dev/null; then
        TABS=$(firefox --sessionstore-backups 2>/dev/null | grep -c "url\":")
        [[ $TABS -gt 5 ]] && echo "- Consider closing excess browser tabs"
    fi
    
    # Suggest flow mode setup
    [[ $DISTRACTIONS -eq 0 ]] && {
        echo -e "\n${GREEN}✓ Environment ready for flow${NC}"
        date +%s > "$FLOW_STATE"
    }
}

# Check focus status
check_focus() {
    separator
    [[ -z "$MINIMAL" ]] && echo -e "${GREEN}🎯 Focus Check - $(date +"%H:%M")${NC}"
    
    # Flow state detection
    if [[ -f "$FLOW_STATE" ]]; then
        FLOW_MINS=$(( ($(date +%s) - $(cat "$FLOW_STATE")) / 60 ))
        if [[ $FLOW_MINS -gt 30 ]]; then
            echo -e "${GREEN}🌊 Flow state detected! ($FLOW_MINS min)${NC}"
            # Don't interrupt if in flow unless urgent
            [[ $FLOW_MINS -lt 90 ]] && return
        fi
    fi
    
    # Break timer (adjusted for flow)
    if [[ -f "$LAST_BREAK" ]]; then
        MINS=$(( ($(date +%s) - $(cat "$LAST_BREAK")) / 60 ))
        if [[ $MINS -gt 90 ]]; then
            echo -e "${RED}⚠️  Extended focus period ($MINS min)${NC}"
            notify "🔄 Break Required" "Protect your flow state - quick break"
        elif [[ $MINS -gt 45 && ! -f "$FLOW_STATE" ]]; then
            echo -e "${YELLOW}⚠️  Break suggested ($MINS min)${NC}"
            notify "🔄 Break Suggested" "Unless in flow state"
        fi
    fi
    
    # Block progress
    BLOCKS=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
    echo -e "${GREEN}Today: $BLOCKS blocks${NC}"
    
    # Distraction check (reduced during flow)
    if [[ ! -f "$FLOW_STATE" ]]; then
        for app in youtube netflix reddit twitter facebook tiktok; do
            pgrep -i "$app" > /dev/null && {
                echo -e "${RED}⚠️  Found: $app${NC}"
                notify "⚠️ Focus Alert" "Detected: $app"
            }
        done
    fi
    
    # System check
    [[ -z "$MINIMAL" ]] && {
        MEM=$(free -h | awk '/^Mem:/ {print $4}')
        CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
        echo -e "${YELLOW}Memory: ${GREEN}$MEM${NC} free"
        echo -e "${YELLOW}CPU: ${GREEN}$CPU%${NC} used"
    }
    
    separator
}

# Show focus pattern stats
show_stats() {
    echo -e "\n${BLUE}Focus Patterns:${NC}"
    echo "Last 7 days:"
    
    # Collect and analyze patterns
    BEST_DAY=0
    BEST_BLOCKS=0
    TOTAL_BLOCKS=0
    
    for i in {6..0}; do
        DATE=$(date -d "$i days ago" +%Y-%m-%d)
        FILE="$DATA_DIR/$DATE.log"
        BLOCKS=$(wc -l < "$FILE" 2>/dev/null || echo 0)
        DAY=$(date -d "$DATE" +%a)
        
        # Track best day
        if [[ $BLOCKS -gt $BEST_BLOCKS ]]; then
            BEST_BLOCKS=$BLOCKS
            BEST_DAY=$DAY
        fi
        
        TOTAL_BLOCKS=$((TOTAL_BLOCKS + BLOCKS))
        
        # Show day with focus indicator
        INDICATOR=""
        [[ $BLOCKS -ge 16 ]] && INDICATOR="🌊"
        [[ $BLOCKS -ge 8 ]] && INDICATOR="💫"
        echo -e "${YELLOW}$DAY:${NC} $BLOCKS blocks $INDICATOR"
    done
    
    # Show insights
    echo -e "\n${BLUE}Insights:${NC}"
    echo "- Best day: $BEST_DAY ($BEST_BLOCKS blocks)"
    echo "- Daily average: $(( TOTAL_BLOCKS / 7 )) blocks"
    
    exit 0
}

# Show optimal focus times
show_when() {
    echo -e "\n${BLUE}Optimal Focus Times:${NC}"
    
    # Analyze logs for patterns
    for FILE in "$DATA_DIR"/*.log; do
        [[ -f "$FILE" ]] || continue
        while read -r LINE; do
            HOUR=$(echo "$LINE" | cut -d: -f1)
            case $HOUR in
                0[7-9]) MORNING=$((MORNING + 1)) ;;
                1[0-1]) MORNING=$((MORNING + 1)) ;;
                1[2-4]) AFTERNOON=$((AFTERNOON + 1)) ;;
                1[5-7]) EVENING=$((EVENING + 1)) ;;
                *) NIGHT=$((NIGHT + 1)) ;;
            esac
        done < "$FILE"
    done
    
    # Show best times
    echo "Based on your history:"
    [[ $MORNING -gt $AFTERNOON && $MORNING -gt $EVENING ]] && echo "🌅 Morning focus peak (7-11am)"
    [[ $AFTERNOON -gt $MORNING && $AFTERNOON -gt $EVENING ]] && echo "☀️  Afternoon focus peak (12-4pm)"
    [[ $EVENING -gt $MORNING && $EVENING -gt $AFTERNOON ]] && echo "🌆 Evening focus peak (5-7pm)"
    
    exit 0
}

# Handle special modes
[[ -n "$STATS" ]] && show_stats
[[ -n "$WHEN" ]] && show_when
[[ -n "$FLOW" ]] && prepare_flow
[[ -n "$DEEP" ]] && { prepare_flow; QUIET=1; MINIMAL=1; }

# Main check
check_focus

# Update break timer (unless in flow)
[[ ! -f "$FLOW_STATE" ]] && date +%s > "$LAST_BREAK"

# Show random tip (33% chance, unless in flow)
[[ ! -f "$FLOW_STATE" ]] && {
    TIPS=(
        "Try 'gf flow' to optimize for hyperfocus"
        "Try 'gf deep' for distraction-free mode"
        "Try 'gf when' to find your best focus times"
        "Use 'gf stats' to track focus patterns"
        "Combine with 'gt' for optimal flow"
    )
    [[ $((RANDOM % 3)) -eq 0 ]] && echo -e "\n${BLUE}Tip:${NC} ${TIPS[$((RANDOM % ${#TIPS[@]}))]}"
}

# Watch mode
[[ -n "$WATCH" ]] && {
    echo -e "\n${YELLOW}Watching focus every 30min. Ctrl+C to stop.${NC}"
    while true; do
        sleep 1800  # 30 minutes
        check_focus
    done
} 