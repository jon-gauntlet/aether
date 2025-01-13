#!/bin/bash

# Knowledge Integration Script
# Integrates knowledge files into the AAA system while preserving flow states

# Source files to integrate
SOURCES=(
  "/home/jon/GAUNTLET_SUCCESS_PATTERNS.md"
  "/home/jon/llm_collaboration_patterns.md"
  "/home/jon/javascript_learnings.md"
)

# Target directories
BRAIN_DIR="/home/jon/brain/aaa"
PATTERNS_DIR="$BRAIN_DIR/patterns"
PRACTICES_DIR="$BRAIN_DIR/practices"
LEARNINGS_DIR="$BRAIN_DIR/learnings"

# Create directories if they don't exist
mkdir -p "$PATTERNS_DIR" "$PRACTICES_DIR" "$LEARNINGS_DIR"

# Integration function
integrate_file() {
  local source=$1
  local filename=$(basename "$source")
  local target=""
  
  # Determine target based on content type
  if [[ $filename == *"PATTERNS"* ]]; then
    target="$PATTERNS_DIR/$filename"
  elif [[ $filename == *"learnings"* ]]; then
    target="$LEARNINGS_DIR/$filename"
  else
    target="$PRACTICES_DIR/$filename"
  fi
  
  # Copy with preservation of metadata
  cp -p "$source" "$target"
  echo "Integrated: $source -> $target"
}

# Main integration loop
for source in "${SOURCES[@]}"; do
  if [ -f "$source" ]; then
    integrate_file "$source"
  else
    echo "Warning: Source file not found: $source"
  fi
done

echo "Knowledge integration complete" 