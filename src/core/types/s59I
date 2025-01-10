#!/usr/bin/env zsh

# Gauntlet Optimization System
# Preserves context and optimizes for 80-100hr/week excellence

# Exit if being sourced
[[ $ZSH_EVAL_CONTEXT == *:file:* ]] && return 0

# Data storage
DATA_DIR="$HOME/.local/share/gauntlet"
CONTEXT_DIR="$DATA_DIR/context"
CURSOR_DIR="$HOME/.cursor"
mkdir -p "$CONTEXT_DIR"/{fs,insights,patterns,errors,success,feedback}

# Track important paths
WORKSPACE="$HOME/workspace"
GAUNTLET_DIR="$WORKSPACE/gauntlet"
BRAINLIFTS_DIR="$WORKSPACE/brainlifts"
PROJECTS_DIR="$WORKSPACE/projects"

# Error and success tracking
track_interaction() {
    local type=$1
    local details=$2
    local timestamp=$(date +%s)
    local file="$CONTEXT_DIR/${type}s/$(date +%Y-%m-%d).jsonl"
    echo "{\"timestamp\":$timestamp,\"type\":\"$type\",\"details\":\"$details\"}" >> "$file"
}

# Learning from patterns
learn_from_patterns() {
    local today=$(date +%Y-%m-%d)
    
    # Analyze success patterns
    grep "success" "$CONTEXT_DIR/success/$today.jsonl" 2>/dev/null |
        jq -r '.details' |
        sort |
        uniq -c |
        sort -nr > "$CONTEXT_DIR/patterns/success_patterns.log"
    
    # Analyze error patterns
    grep "error" "$CONTEXT_DIR/errors/$today.jsonl" 2>/dev/null |
        jq -r '.details' |
        sort |
        uniq -c |
        sort -nr > "$CONTEXT_DIR/patterns/error_patterns.log"
    
    # Generate learning insights
    {
        echo "## Success Patterns"
        head -n 5 "$CONTEXT_DIR/patterns/success_patterns.log"
        echo "## Error Patterns"
        head -n 5 "$CONTEXT_DIR/patterns/error_patterns.log"
        echo "## Recommendations"
        paste "$CONTEXT_DIR/patterns/success_patterns.log" "$CONTEXT_DIR/patterns/error_patterns.log" |
            awk '{print "- Prefer: " $2 " (" $1 " successes) over: " $4 " (" $3 " errors)"}'
    } > "$CONTEXT_DIR/patterns/learnings.md"
}

# Context preservation with feedback
preserve_context() {
    # Filesystem state
    find "$WORKSPACE" -type f -not -path "*/\.*" -mtime -1 > "$CONTEXT_DIR/fs/recent_files.log"
    
    # Recent learnings
    tail -n 100 "$DATA_DIR/brain/notes.md" > "$CONTEXT_DIR/insights/recent_notes.md"
    
    # Deep work patterns
    grep "$(date +%Y-%m-%d)" "$DATA_DIR/stats/deep.log" > "$CONTEXT_DIR/patterns/deep_work.log"
    
    # Project context with error tracking
    for project in "$PROJECTS_DIR"/*; do
        [[ -d "$project" ]] || continue
        project_name=$(basename "$project")
        {
            echo "# $project_name Context"
            echo "## Recent Files"
            find "$project" -type f -mtime -1 -not -path "*/\.*" | sed 's|.*/||'
            echo "## Git Status"
            (cd "$project" && git status --short 2>/dev/null)
            echo "## Recent Commits"
            (cd "$project" && git log --oneline -5 2>/dev/null)
            echo "## Error Patterns"
            [[ -f "$CONTEXT_DIR/errors/${project_name}.jsonl" ]] &&
                tail -n 5 "$CONTEXT_DIR/errors/${project_name}.jsonl" |
                jq -r '.details'
            echo "## Success Patterns"
            [[ -f "$CONTEXT_DIR/success/${project_name}.jsonl" ]] &&
                tail -n 5 "$CONTEXT_DIR/success/${project_name}.jsonl" |
                jq -r '.details'
        } > "$CONTEXT_DIR/fs/${project_name}_context.md"
    done
}

# Cursor optimization with learning
optimize_cursor() {
    # Preserve custom instructions
    cp "$CURSOR_DIR/custom-instructions" "$CONTEXT_DIR/cursor_instructions.bak"
    
    # Update with latest insights and learnings
    {
        echo "# Gauntlet AI Success Optimization"
        echo
        echo "## Core Focus"
        echo "- Support 80-100 hours/week of focused development"
        echo "- Optimize for ADHD hyperfocus states"
        echo "- Maintain code quality through exhaustion"
        echo "- Build with AI effectively and ethically"
        echo "- Win the Gauntlet through sustained excellence"
        echo
        echo "## Recent Context"
        echo "$(cat "$CONTEXT_DIR/insights/recent_notes.md")"
        echo
        echo "## Active Projects"
        for ctx in "$CONTEXT_DIR/fs/"*_context.md; do
            [[ -f "$ctx" ]] && cat "$ctx"
        done
        echo
        echo "## Learning Patterns"
        [[ -f "$CONTEXT_DIR/patterns/learnings.md" ]] && cat "$CONTEXT_DIR/patterns/learnings.md"
    } > "$CURSOR_DIR/custom-instructions"
}

# Pattern analysis with feedback
analyze_patterns() {
    local today=$(date +%Y-%m-%d)
    
    # Peak performance windows
    grep "$today" "$DATA_DIR/stats/deep.log" | 
        awk '{print $2}' | 
        sort | 
        uniq -c | 
        sort -nr > "$CONTEXT_DIR/patterns/peak_hours.log"
    
    # Learning velocity
    grep "$today" "$DATA_DIR/stats/brain.log" |
        wc -l > "$CONTEXT_DIR/patterns/learning_rate.log"
    
    # Focus blocks
    grep "$today" "$DATA_DIR/stats/timer.log" |
        awk '{print $NF}' |
        sort |
        uniq -c > "$CONTEXT_DIR/patterns/focus_blocks.log"
    
    # Learn from patterns
    learn_from_patterns
}

# Main optimization loop
main() {
    while true; do
        # Track start of cycle
        track_interaction "cycle" "start"
        
        # Run optimizations with error handling
        {
            preserve_context
            analyze_patterns
            optimize_cursor
            track_interaction "success" "optimization_cycle_complete"
        } || {
            track_interaction "error" "optimization_cycle_failed: $?"
        }
        
        # Learn from this cycle
        learn_from_patterns
        
        # Wait for next cycle (hourly)
        sleep 3600
    done
}

# Run in background if no arguments
if [[ $# -eq 0 ]]; then
    main &
    disown
    exit 0
fi

# Handle commands
case $1 in
    start)
        pkill -f "gauntlet/optimize" 2>/dev/null
        main &
        disown
        echo "Optimization system started"
        ;;
    stop)
        pkill -f "gauntlet/optimize"
        echo "Optimization system stopped"
        ;;
    status)
        if pgrep -f "gauntlet/optimize" >/dev/null; then
            echo "Optimization system: Active"
            echo "Recent patterns:"
            tail -n 5 "$CONTEXT_DIR/patterns/peak_hours.log"
            echo "Recent learnings:"
            tail -n 5 "$CONTEXT_DIR/patterns/learnings.md"
        else
            echo "Optimization system: Inactive"
        fi
        ;;
    learn)
        echo "Recent Success Patterns:"
        tail -n 5 "$CONTEXT_DIR/patterns/success_patterns.log"
        echo "Recent Error Patterns:"
        tail -n 5 "$CONTEXT_DIR/patterns/error_patterns.log"
        echo "Learning Recommendations:"
        tail -n 5 "$CONTEXT_DIR/patterns/learnings.md"
        ;;
    *)
        echo "Usage: optimize [start|stop|status|learn]"
        ;;
esac 