#!/bin/bash
set -euo pipefail

# Check required dependencies
check_dependency() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: Required dependency '$1' is not installed" >&2
        exit 1
    fi
}

check_dependency notify-send

# Ensure EDITOR is set
if [ -z "${EDITOR:-}" ]; then
    if command -v vim >/dev/null 2>&1; then
        EDITOR="vim"
    elif command -v nano >/dev/null 2>&1; then
        EDITOR="nano"
    else
        echo "Error: No editor found. Please set EDITOR environment variable" >&2
        exit 1
    fi
fi

# Define paths
BRAIN_DIR="$HOME/.hidden_context/personal/brainlifts"
CONTEXT_DIR="$HOME/.cache/cursor/context"
CONTEXT_LOG="$CONTEXT_DIR/brainlifts.log"

# Ensure directories exist
for dir in "$BRAIN_DIR" "$CONTEXT_DIR"; do
    if ! mkdir -p "$dir" 2>/dev/null; then
        echo "Error: Failed to create directory: $dir" >&2
        exit 1
    fi
done

# Function to safely read first line of file
read_title() {
    local file="$1"
    if [ -f "$file" ]; then
        head -n 1 "$file" 2>/dev/null | sed 's/# //' || echo "Untitled"
    else
        echo "Untitled"
    fi
}

# Function to list BrainLifts
list_brainlifts() {
    local count=0
    echo "=== Active BrainLifts ==="
    
    # Find and sort files by modification time
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo "- $(basename "$file" .md): $(read_title "$file")"
            ((count++))
        fi
    done < <(find "$BRAIN_DIR" -name "*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null)
    
    if [ "$count" -eq 0 ]; then
        echo "No active BrainLifts found"
    fi
    
    notify-send "BrainLifts" "Found $count active lifts"
}

# Function to create new BrainLift
new_brainlift() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local filename="$BRAIN_DIR/brainlift_${timestamp}.md"
    
    # Create BrainLift template
    {
        echo "# BrainLift ($timestamp)"
        echo ""
        echo "## Context"
        echo "- Created: $(date '+%Y-%m-%d %H:%M:%S')"
        if git rev-parse --git-dir >/dev/null 2>&1; then
            echo "- Project: $(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "unknown")"
            echo "- Branch: $(git branch --show-current 2>/dev/null || echo "unknown")"
        fi
        echo ""
        echo "## Focus"
        echo "- [ ] Define primary objective"
        echo "- [ ] Break down into steps"
        echo "- [ ] Set success criteria"
        echo ""
        echo "## Progress"
        echo "- [ ] Initial setup complete"
        echo ""
        echo "## Notes"
        echo "- "
        echo ""
        echo "## Tags"
        echo "- #brainlift"
        echo "- #active"
    } > "$filename"
    
    # Open in editor
    if ! "$EDITOR" "$filename"; then
        rm -f "$filename"
        echo "Error: Failed to edit BrainLift" >&2
        exit 1
    fi
    
    # Update context
    echo "$(date +%s) brainlift_created $filename" >> "$CONTEXT_LOG"
    find "$BRAIN_DIR" -name "*.md" -exec touch {} + 2>/dev/null || true
    
    notify-send "BrainLift Created" "$(basename "$filename")"
}

# Show usage
show_usage() {
    echo "Usage: $(basename "$0") [command]"
    echo ""
    echo "Commands:"
    echo "  new, n    Create new BrainLift"
    echo "  list, l   List active BrainLifts"
    echo "  help      Show this help message"
}

# Parse arguments
case "${1:-}" in
    "new"|"n")
        new_brainlift
        ;;
    "list"|"l"|"")
        list_brainlifts
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "Error: Unknown command '${1:-}'" >&2
        show_usage
        exit 1
        ;;
esac 