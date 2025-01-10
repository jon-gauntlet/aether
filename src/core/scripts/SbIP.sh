#!/bin/bash

# Integration health check for the Essence System
ESSENCE_ROOT="$HOME/.config/cursor/contexts/sacred"
PRINCIPLES_DIR="$ESSENCE_ROOT/principles"
ORTHODOX_DIR="$ESSENCE_ROOT/orthodox"
PRACTICE_DIR="$ESSENCE_ROOT/practice"

check_principle_harmony() {
    echo "Checking principle harmony..."
    for principle in "$PRINCIPLES_DIR"/*.md; do
        # Check cross-references
        refs=$(grep -l "$(basename "$principle")" "$PRINCIPLES_DIR"/*.md | wc -l)
        if [ "$refs" -lt 2 ]; then
            echo "Warning: $(basename "$principle") may be isolated (few cross-references)"
        fi
        
        # Check core patterns
        if ! grep -q "## Core" "$principle"; then
            echo "Warning: $(basename "$principle") missing core pattern section"
        fi
        
        # Check essence section
        if ! grep -q "## Essence" "$principle"; then
            echo "Warning: $(basename "$principle") missing essence section"
        fi
    done
}

check_orthodox_integration() {
    echo "Checking Orthodox integration..."
    for principle in "$PRINCIPLES_DIR"/*.md; do
        # Check for theological grounding
        if ! grep -q -i "divine\|god\|christ\|orthodox\|church\|spirit" "$principle"; then
            echo "Warning: $(basename "$principle") may need stronger Orthodox grounding"
        fi
    done
}

check_practice_alignment() {
    echo "Checking practice alignment..."
    for practice in "$PRACTICE_DIR"/*.md; do
        # Check principle references
        refs=$(grep -l "$(basename "$practice")" "$PRINCIPLES_DIR"/*.md | wc -l)
        if [ "$refs" -eq 0 ]; then
            echo "Warning: $(basename "$practice") not referenced by any principles"
        fi
    done
}

check_system_identity() {
    echo "Checking system identity..."
    # Core identity markers
    markers=("Essence" "Orthodox" "Integration" "Pattern" "Practice" "Principle")
    for marker in "${markers[@]}"; do
        count=$(find "$ESSENCE_ROOT" -type f -exec grep -l "$marker" {} \; | wc -l)
        echo "$marker presence: $count files"
    done
}

echo "=== Essence System Integration Check ==="
echo "Timestamp: $(date)"
echo
check_principle_harmony
echo
check_orthodox_integration
echo
check_practice_alignment
echo
check_system_identity
echo
echo "=== Integration Check Complete ===" 