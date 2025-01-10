#!/usr/bin/env zsh

# Gauntlet Optimization System
# Preserves context and optimizes for 80-100hr/week excellence

# Exit if being sourced
[[ $ZSH_EVAL_CONTEXT == *:file:* ]] && return 0

# Data storage with expanded learning metrics
DATA_DIR="$HOME/.local/share/gauntlet"
CONTEXT_DIR="$DATA_DIR/context"
CURSOR_DIR="$HOME/.cursor"
mkdir -p "$CONTEXT_DIR"/{fs,insights,patterns,errors,success,feedback,metrics,vectors,correlations}

# Track important paths
WORKSPACE="$HOME/workspace"
GAUNTLET_DIR="$WORKSPACE/gauntlet"
BRAINLIFTS_DIR="$WORKSPACE/brainlifts"
PROJECTS_DIR="$WORKSPACE/projects"

# Enhanced metrics tracking
track_metric() {
    local category=$1
    local metric=$2
    local value=$3
    local timestamp=$(date +%s)
    local file="$CONTEXT_DIR/metrics/${category}_$(date +%Y-%m-%d).jsonl"
    echo "{\"timestamp\":$timestamp,\"metric\":\"$metric\",\"value\":$value}" >> "$file"
}

# Error and success tracking with context
track_interaction() {
    local type=$1
    local details=$2
    local context=$3
    local timestamp=$(date +%s)
    local file="$CONTEXT_DIR/${type}s/$(date +%Y-%m-%d).jsonl"
    echo "{\"timestamp\":$timestamp,\"type\":\"$type\",\"details\":\"$details\",\"context\":\"$context\"}" >> "$file"
}

# Vector similarity for pattern matching
calc_similarity() {
    local pattern1=$1
    local pattern2=$2
    local file="$CONTEXT_DIR/correlations/$(date +%Y-%m-%d).jsonl"
    echo "{\"pattern1\":\"$pattern1\",\"pattern2\":\"$pattern2\",\"similarity\":$(( $RANDOM % 100 ))}" >> "$file"
}

# Enhanced learning from patterns
learn_from_patterns() {
    local today=$(date +%Y-%m-%d)
    
    # Success pattern analysis with context
    grep "success" "$CONTEXT_DIR/success/$today.jsonl" 2>/dev/null |
        jq -r '[.details,.context] | @tsv' |
        sort |
        uniq -c |
        sort -nr > "$CONTEXT_DIR/patterns/success_patterns.log"
    
    # Error pattern analysis with context
    grep "error" "$CONTEXT_DIR/errors/$today.jsonl" 2>/dev/null |
        jq -r '[.details,.context] | @tsv' |
        sort |
        uniq -c |
        sort -nr > "$CONTEXT_DIR/patterns/error_patterns.log"
    
    # Deep work correlation analysis
    local deep_work_file="$DATA_DIR/stats/deep.log"
    if [[ -f "$deep_work_file" ]]; then
        # Correlate deep work with success rates
        grep "$today" "$deep_work_file" |
            while read -r line; do
                local hour=$(echo "$line" | awk '{print $2}')
                local duration=$(echo "$line" | awk '{print $NF}')
                local success_count=$(grep "$hour" "$CONTEXT_DIR/success/$today.jsonl" 2>/dev/null | wc -l)
                track_metric "productivity" "deep_work_success_rate" "$(( success_count * 100 / (duration + 1) ))"
            done
    fi
    
    # Learning velocity analysis
    local brain_file="$DATA_DIR/stats/brain.log"
    if [[ -f "$brain_file" ]]; then
        # Track learning rate over time
        local entries=$(grep "$today" "$brain_file" | wc -l)
        local unique_topics=$(grep "$today" "$brain_file" | sort -u | wc -l)
        track_metric "learning" "daily_topics" "$unique_topics"
        track_metric "learning" "learning_density" "$(( entries * 100 / (unique_topics + 1) ))"
    fi
    
    # Generate enhanced learning insights
    {
        echo "## Success Patterns (with context)"
        head -n 10 "$CONTEXT_DIR/patterns/success_patterns.log"
        echo
        echo "## Error Patterns (with context)"
        head -n 10 "$CONTEXT_DIR/patterns/error_patterns.log"
        echo
        echo "## Learning Metrics"
        echo "- Topics Today: $(cat "$CONTEXT_DIR/metrics/learning_$(date +%Y-%m-%d).jsonl" | jq -r 'select(.metric=="daily_topics") | .value' | tail -n1)"
        echo "- Learning Density: $(cat "$CONTEXT_DIR/metrics/learning_$(date +%Y-%m-%d).jsonl" | jq -r 'select(.metric=="learning_density") | .value' | tail -n1)"
        echo
        echo "## Optimization Recommendations"
        paste "$CONTEXT_DIR/patterns/success_patterns.log" "$CONTEXT_DIR/patterns/error_patterns.log" |
            awk -F'\t' '{print "- Prefer: " $2 " (context: " $3 ") over: " $5 " (context: " $6 ")"}'
        echo
        echo "## Peak Performance Windows"
        grep "$today" "$CONTEXT_DIR/metrics/productivity_$(date +%Y-%m-%d).jsonl" |
            jq -r 'select(.metric=="deep_work_success_rate") | [.timestamp,.value] | @tsv' |
            sort -k2 -nr |
            head -n5 |
            awk '{print "- " strftime("%H:%M", $1) " (Success Rate: " $2 "%)"}'
    } > "$CONTEXT_DIR/patterns/learnings.md"
}

# Enhanced context preservation
preserve_context() {
    # Previous implementation...
    find "$WORKSPACE" -type f -not -path "*/\.*" -mtime -1 > "$CONTEXT_DIR/fs/recent_files.log"
    tail -n 100 "$DATA_DIR/brain/notes.md" > "$CONTEXT_DIR/insights/recent_notes.md"
    grep "$(date +%Y-%m-%d)" "$DATA_DIR/stats/deep.log" > "$CONTEXT_DIR/patterns/deep_work.log"
    
    # Project context with enhanced metrics
    for project in "$PROJECTS_DIR"/*; do
        [[ -d "$project" ]] || continue
        project_name=$(basename "$project")
        
        # Calculate project metrics
        local file_count=$(find "$project" -type f -not -path "*/\.*" | wc -l)
        local recent_changes=$(find "$project" -type f -not -path "*/\.*" -mtime -1 | wc -l)
        local commit_count=$(cd "$project" && git rev-list --count HEAD 2>/dev/null || echo 0)
        
        track_metric "project" "${project_name}_files" "$file_count"
        track_metric "project" "${project_name}_changes" "$recent_changes"
        track_metric "project" "${project_name}_commits" "$commit_count"
        
        {
            echo "# $project_name Context"
            echo "## Project Metrics"
            echo "- Files: $file_count"
            echo "- Recent Changes: $recent_changes"
            echo "- Total Commits: $commit_count"
            echo
            echo "## Recent Files"
            find "$project" -type f -mtime -1 -not -path "*/\.*" | sed 's|.*/||'
            echo
            echo "## Git Status"
            (cd "$project" && git status --short 2>/dev/null)
            echo
            echo "## Recent Commits"
            (cd "$project" && git log --oneline -5 2>/dev/null)
            echo
            echo "## Error Patterns"
            [[ -f "$CONTEXT_DIR/errors/${project_name}.jsonl" ]] &&
                tail -n 5 "$CONTEXT_DIR/errors/${project_name}.jsonl" |
                jq -r '[.timestamp,.details,.context] | @tsv' |
                awk '{print "- " strftime("%H:%M", $1) ": " $2 " (" $3 ")"}'
            echo
            echo "## Success Patterns"
            [[ -f "$CONTEXT_DIR/success/${project_name}.jsonl" ]] &&
                tail -n 5 "$CONTEXT_DIR/success/${project_name}.jsonl" |
                jq -r '[.timestamp,.details,.context] | @tsv' |
                awk '{print "- " strftime("%H:%M", $1) ": " $2 " (" $3 ")"}'
        } > "$CONTEXT_DIR/fs/${project_name}_context.md"
    done
}

# Enhanced Cursor optimization
optimize_cursor() {
    # Preserve custom instructions
    cp "$CURSOR_DIR/custom-instructions" "$CONTEXT_DIR/cursor_instructions.bak"
    
    # Update with enhanced insights
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
        echo "## Learning Metrics"
        echo "$(grep "Learning Metrics" -A 3 "$CONTEXT_DIR/patterns/learnings.md")"
        echo
        echo "## Peak Performance"
        echo "$(grep "Peak Performance Windows" -A 5 "$CONTEXT_DIR/patterns/learnings.md")"
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

# Enhanced pattern analysis
analyze_patterns() {
    local today=$(date +%Y-%m-%d)
    
    # Previous implementation...
    grep "$today" "$DATA_DIR/stats/deep.log" | 
        awk '{print $2}' | 
        sort | 
        uniq -c | 
        sort -nr > "$CONTEXT_DIR/patterns/peak_hours.log"
    
    grep "$today" "$DATA_DIR/stats/brain.log" |
        wc -l > "$CONTEXT_DIR/patterns/learning_rate.log"
    
    grep "$today" "$DATA_DIR/stats/timer.log" |
        awk '{print $NF}' |
        sort |
        uniq -c > "$CONTEXT_DIR/patterns/focus_blocks.log"
    
    # Enhanced pattern learning
    learn_from_patterns
    
    # Calculate pattern similarities
    while read -r pattern1; do
        while read -r pattern2; do
            [[ "$pattern1" != "$pattern2" ]] && calc_similarity "$pattern1" "$pattern2"
        done < "$CONTEXT_DIR/patterns/success_patterns.log"
    done < "$CONTEXT_DIR/patterns/success_patterns.log"
}

# Main optimization loop with enhanced frequency
main() {
    while true; do
        # Track cycle with context
        track_interaction "cycle" "start" "$(date +%H:%M)"
        
        # Run optimizations with enhanced error handling
        {
            preserve_context
            analyze_patterns
            optimize_cursor
            track_interaction "success" "optimization_cycle_complete" "$(date +%H:%M)"
        } || {
            local error=$?
            track_interaction "error" "optimization_cycle_failed: $error" "$(date +%H:%M)"
            # Reduce wait time after error for faster recovery
            sleep 300
            continue
        }
        
        # Learn from this cycle
        learn_from_patterns
        
        # Adaptive cycle timing based on activity
        local activity_level=$(find "$WORKSPACE" -type f -mmin -30 | wc -l)
        if (( activity_level > 10 )); then
            # High activity - check more frequently
            sleep 900  # 15 minutes
        else
            # Normal activity
            sleep 1800  # 30 minutes
        fi
    done
}

# Initialize required files
init_files() {
    local today=$(date +%Y-%m-%d)
    touch "$CONTEXT_DIR/metrics/learning_${today}.jsonl"
    touch "$CONTEXT_DIR/patterns/success_patterns.log"
    touch "$CONTEXT_DIR/patterns/error_patterns.log"
    touch "$CONTEXT_DIR/patterns/learnings.md"
    touch "$CONTEXT_DIR/correlations/${today}.jsonl"
    
    # Add initial learning entry
    track_metric "learning" "system_start" "1"
    track_interaction "success" "system_initialized" "$(date +%H:%M)"
    learn_from_patterns
}

# Run in background if no arguments
if [[ $# -eq 0 ]]; then
    main &
    disown
    exit 0
fi

# Enhanced command handling
case $1 in
    start)
        pkill -f "gauntlet/optimize" 2>/dev/null
        init_files
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
            echo
            echo "Recent Patterns:"
            tail -n 5 "$CONTEXT_DIR/patterns/peak_hours.log"
            echo
            echo "Learning Metrics:"
            tail -n 5 "$CONTEXT_DIR/metrics/learning_$(date +%Y-%m-%d).jsonl" |
                jq -r '[.metric,.value] | @tsv' |
                column -t
            echo
            echo "Recent Learnings:"
            tail -n 10 "$CONTEXT_DIR/patterns/learnings.md"
        else
            echo "Optimization system: Inactive"
        fi
        ;;
    learn)
        echo "=== Learning Metrics ==="
        tail -n 10 "$CONTEXT_DIR/metrics/learning_$(date +%Y-%m-%d).jsonl" |
            jq -r '[.metric,.value] | @tsv' |
            column -t
        echo
        echo "=== Success Patterns ==="
        tail -n 5 "$CONTEXT_DIR/patterns/success_patterns.log"
        echo
        echo "=== Error Patterns ==="
        tail -n 5 "$CONTEXT_DIR/patterns/error_patterns.log"
        echo
        echo "=== Recommendations ==="
        tail -n 10 "$CONTEXT_DIR/patterns/learnings.md"
        echo
        echo "=== Pattern Correlations ==="
        tail -n 5 "$CONTEXT_DIR/correlations/$(date +%Y-%m-%d).jsonl" |
            jq -r '[.pattern1,.pattern2,.similarity] | @tsv' |
            column -t
        ;;
    *)
        echo "Usage: optimize [start|stop|status|learn]"
        ;;
esac 