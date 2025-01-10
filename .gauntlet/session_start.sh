#!/bin/bash

# Ensure BrainLifts are loaded at session start
GAUNTLET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_CONTEXT="$GAUNTLET_DIR/auto_context.json"
BRAINLIFTS_DIR="/home/jon/brainlifts"

# Verify paths
if [ ! -f "$AUTO_CONTEXT" ]; then
    echo "Error: auto_context.json not found"
    exit 1
fi

if [ ! -d "$BRAINLIFTS_DIR" ]; then
    echo "Error: BrainLifts directory not found"
    exit 1
fi

# Verify BrainLifts
REQUIRED_FILES=(
    "flow-state-optimization.md"
    "ai-first-development.md"
    "natural-system-design.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BRAINLIFTS_DIR/$file" ]; then
        echo "Error: Required BrainLift not found: $file"
        exit 1
    fi
done

# Create symbolic links if needed
if [ ! -d "$GAUNTLET_DIR/brainlifts" ]; then
    mkdir -p "$GAUNTLET_DIR/brainlifts"
fi

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -L "$GAUNTLET_DIR/brainlifts/$file" ]; then
        ln -s "$BRAINLIFTS_DIR/$file" "$GAUNTLET_DIR/brainlifts/$file"
    fi
done

# Verify content (basic check)
for file in "${REQUIRED_FILES[@]}"; do
    if ! grep -q "SpikyPOVs" "$BRAINLIFTS_DIR/$file"; then
        echo "Warning: BrainLift may be corrupted: $file"
        exit 1
    fi
done

echo "BrainLifts integration verified and ready"
exit 0 