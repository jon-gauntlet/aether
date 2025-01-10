#!/usr/bin/env zsh

# Gauntlet Optimization System
# Preserves context and optimizes for 80-100hr/week excellence

# Exit if being sourced
[[ $ZSH_EVAL_CONTEXT == *:file:* ]] && return 0

# Data storage
DATA_DIR="$HOME/.local/share/gauntlet"
CONTEXT_DIR="$DATA_DIR/context"
CURSOR_DIR="$HOME/.cursor"
mkdir -p "$CONTEXT_DIR"/{fs,insights,patterns}

# Track important paths
WORKSPACE="$HOME/workspace"
GAUNTLET_DIR="$WORKSPACE/gauntlet"
BRAINLIFTS_DIR="$WORKSPACE/brainlifts"
PROJECTS_DIR="$WORKSPACE/projects"

# Context preservation
preserve_context() {
    # Filesystem state
    find "$WORKSPACE" -type f -not -path "*/\.*" -mtime -1 > "$CONTEXT_DIR/fs/recent_files.log"
    
    # Recent learnings
    tail -n 100 "$DATA_DIR/brain/notes.md" > "$CONTEXT_DIR/insights/recent_notes.md"
    
    # Deep work patterns
    grep "$(date +%Y-%m-%d)" "$DATA_DIR/stats/deep.log" > "$CONTEXT_DIR/patterns/deep_work.log"
    
    # Project context
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
        } > "$CONTEXT_DIR/fs/${project_name}_context.md"
    done
}

# Cursor optimization
optimize_cursor() {
    # Preserve custom instructions
    cp "$CURSOR_DIR/custom-instructions" "$CONTEXT_DIR/cursor_instructions.bak"
    
    # Update with latest insights
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
    } > "$CURSOR_DIR/custom-instructions"
}

# Pattern analysis
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
}

# Main optimization loop
main() {
    while true; do
        # Preserve current context
        preserve_context
        
        # Analyze patterns
        analyze_patterns
        
        # Update Cursor optimization
        optimize_cursor
        
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
        else
            echo "Optimization system: Inactive"
        fi
        ;;
    *)
        echo "Usage: optimize [start|stop|status]"
        ;;
esac 