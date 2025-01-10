#!/bin/zsh

# Hook to save Cursor window context
save_window_context() {
  local WINDOW_ID=$1
  local CONTEXT_FILE="$HOME/.cursor/contexts/temp/window_${WINDOW_ID}.ctx"
  local CONTEXT_DIR="$(dirname "$CONTEXT_FILE")"
  
  # Ensure directory exists
  mkdir -p "$CONTEXT_DIR" 2>/dev/null || true
  
  # Save window state and context
  echo "Window ID: $WINDOW_ID" > "$CONTEXT_FILE"
  echo "Timestamp: $(date +%s)" >> "$CONTEXT_FILE"
  echo "Directory: $(pwd)" >> "$CONTEXT_FILE"
  # Add any active file contexts
  if [ -f ".cursor-context" ]; then
    cat ".cursor-context" >> "$CONTEXT_FILE"
  fi
}

# Hook to load Cursor window context
load_window_context() {
  local WINDOW_ID=$1
  local CONTEXT_FILE="$HOME/.cursor/contexts/temp/window_${WINDOW_ID}.ctx"
  if [ -f "$CONTEXT_FILE" ]; then
    # Load window state and context
    local SAVED_DIR=$(grep "Directory:" "$CONTEXT_FILE" | cut -d" " -f2-)
    [ -d "$SAVED_DIR" ] && cd "$SAVED_DIR"
    # Load any saved file contexts
    grep -v "^Window ID:\|^Timestamp:\|^Directory:" "$CONTEXT_FILE" > ".cursor-context" 2>/dev/null || true
  fi
}

# Make functions available to subshells
typeset -fx save_window_context
typeset -fx load_window_context 