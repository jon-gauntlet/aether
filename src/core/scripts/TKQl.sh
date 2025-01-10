#!/usr/bin/env zsh

# AI Pair Programming Assistant
# Helps maintain AI-first development practices
# Integrates with timer for focused coding sessions

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
DATA_DIR="$HOME/.local/share/gauntlet/ai-pair"
SESSIONS_FILE="$DATA_DIR/sessions.json"
PROMPTS_FILE="$DATA_DIR/prompts.md"
PATTERNS_FILE="$DATA_DIR/patterns.json"
mkdir -p "$DATA_DIR"

# Initialize files if needed
[[ -f $SESSIONS_FILE ]] || echo '[]' > "$SESSIONS_FILE"
[[ -f $PROMPTS_FILE ]] || touch "$PROMPTS_FILE"
[[ -f $PATTERNS_FILE ]] || echo '{}' > "$PATTERNS_FILE"

# Show help
show_help() {
    cat << EOF
AI Pair Programming Assistant

Quick Start:
  pair start         Begin AI pair session
  pair note          Save useful prompt
  pair review        Review recent sessions
  pair stats         Pairing analytics

Session Types:
  pair plan          Planning session
  pair code          Coding session
  pair debug         Debugging session
  pair refactor      Refactoring session

Prompts:
  pair prompt        Show relevant prompts
  pair save          Save effective prompt
  pair search        Find saved prompts

Tips shown during sessions!
EOF
    exit 0
}

# Record a pairing session
record_session() {
    local type=$1
    local duration=$2
    local notes=$3
    local timestamp=$(date +%s)
    
    # Add session
    local sessions=$(cat "$SESSIONS_FILE")
    sessions=$(echo "$sessions" | jq ". + [{\"type\": \"$type\", \"duration\": $duration, \"timestamp\": $timestamp, \"notes\": \"$notes\"}]")
    echo "$sessions" > "$SESSIONS_FILE"
    
    # Update patterns
    local patterns=$(cat "$PATTERNS_FILE")
    if echo "$patterns" | jq -e ".\"$type\"" >/dev/null; then
        patterns=$(echo "$patterns" | jq ".\"$type\".count += 1 | .\"$type\".last = $timestamp")
    else
        patterns=$(echo "$patterns" | jq ". + {\"$type\": {\"count\": 1, \"first\": $timestamp, \"last\": $timestamp}}")
    fi
    echo "$patterns" > "$PATTERNS_FILE"
}

# Save useful prompt
save_prompt() {
    local context=$1
    local prompt=$2
    local timestamp=$(date +%Y-%m-%d\ %H:%M)
    echo -e "\n## $timestamp - $context\n$prompt" >> "$PROMPTS_FILE"
    echo -e "${GREEN}✓ Prompt saved${NC}"
}

# Show pairing analytics
show_stats() {
    echo -e "\n${BLUE}Pairing Analytics:${NC}"
    
    # Calculate stats
    local sessions=$(cat "$SESSIONS_FILE")
    local total=$(echo "$sessions" | jq 'length')
    local today=$(echo "$sessions" | jq --arg now "$(date +%Y-%m-%d)" '[.[] | select(.timestamp | strftime("%Y-%m-%d") == $now)] | length')
    local week=$(echo "$sessions" | jq '[.[] | select(.timestamp >= now - 604800)] | length')
    
    echo -e "${YELLOW}Sessions:${NC}"
    echo "- Today: $today"
    echo "- This week: $week"
    echo "- Total: $total"
    
    # Show session types
    echo -e "\n${BLUE}Session Types:${NC}"
    local patterns=$(cat "$PATTERNS_FILE")
    echo "$patterns" | jq -r 'to_entries | sort_by(.value.count) | reverse | .[] | "- \(.key): \(.value.count) sessions"'
    
    # Calculate effectiveness
    echo -e "\n${BLUE}Effectiveness:${NC}"
    local prompts=$(wc -l < "$PROMPTS_FILE")
    local ratio=$(( prompts * 100 / (total + 1) ))
    echo "Prompt save rate: $ratio%"
}

# Start pairing session
start_session() {
    local type=$1
    local duration=25
    
    case $type in
        plan) 
            duration=15
            echo -e "${BLUE}Planning Session${NC}"
            echo "Tips:"
            echo "1. Describe the goal clearly"
            echo "2. Break into small steps"
            echo "3. Consider edge cases"
            ;;
        code)
            duration=25
            echo -e "${BLUE}Coding Session${NC}"
            echo "Tips:"
            echo "1. Start with tests"
            echo "2. Small, verifiable changes"
            echo "3. Document assumptions"
            ;;
        debug)
            duration=20
            echo -e "${BLUE}Debugging Session${NC}"
            echo "Tips:"
            echo "1. Describe the problem"
            echo "2. Show relevant context"
            echo "3. List what you tried"
            ;;
        refactor)
            duration=30
            echo -e "${BLUE}Refactoring Session${NC}"
            echo "Tips:"
            echo "1. Explain the goal"
            echo "2. Show before/after"
            echo "3. Maintain behavior"
            ;;
        *)
            echo -e "${BLUE}General Session${NC}"
            echo "Tips:"
            echo "1. Be specific"
            echo "2. Show context"
            echo "3. Iterate quickly"
            ;;
    esac
    
    # Start timer
    gt $duration
    
    # Capture notes
    echo -e "\n${YELLOW}Session notes? (Enter to skip)${NC}"
    read -r notes
    
    # Record session
    record_session "$type" $duration "${notes:-No notes}"
    
    # Prompt for useful prompts
    echo -e "\n${YELLOW}Save useful prompt? (Enter to skip)${NC}"
    read -r prompt
    [[ -n "$prompt" ]] && save_prompt "$type" "$prompt"
    
    # Show completion
    echo -e "\n${GREEN}Session complete!${NC}"
    echo -e "${BLUE}Next Steps:${NC}"
    echo "- Review with 'pair stats'"
    echo "- Save prompts with 'pair save'"
    echo "- Start new session with 'pair start'"
}

# Handle commands
case $1 in
    help|--help|-h) show_help ;;
    start) shift; start_session "${1:-general}" ;;
    plan|code|debug|refactor) start_session "$1" ;;
    note) shift; save_prompt "general" "$*" ;;
    stats) show_stats ;;
    *) show_help ;;
esac 