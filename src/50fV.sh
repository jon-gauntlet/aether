#!/bin/bash
# Cursor Window Hooks
# This script provides hooks for window management to protect flow states.

# Core paths
WORKSPACE="/home/jon/workspace/gauntlet"
BRAIN_DIR="/home/jon/brain"
CONFIG_DIR="/home/jon/.config/cursor"
LOCAL_STATE="/home/jon/.local/state/cursor"
LOCAL_SHARE="/home/jon/.local/share/cursor"

# Flow paths
FLOW_MGR="/home/jon/scripts/cursor/flow-manager"
FLOW_STATE="$LOCAL_STATE/flow"
FLOW_LOG="$FLOW_STATE/flow.log"

# Ensure state directory exists
mkdir -p "$FLOW_STATE"
touch "$FLOW_LOG"

# Logging
function log_hook() {
  local message="$1"
  echo "$(date '+%Y-%m-%d %H:%M:%S'): $message" >> "$FLOW_LOG"
}

# Flow state management
function get_flow_state() {
  if [[ -f "$FLOW_STATE/current" ]]; then
    cat "$FLOW_STATE/current"
  else
    echo "normal"
  fi
}

# Window hooks
function on_window_focus() {
  local window_title="$1"
  local current_state=$(get_flow_state)
  
  log_hook "Window focus: $window_title (State: $current_state)"
  
  case "$current_state" in
    deep)
      # Protect deep work
      if [[ "$window_title" =~ (email|slack|discord) ]]; then
        log_hook "Blocking distraction: $window_title"
        exit 1
      fi
      ;;
    normal)
      # Allow normal switching
      log_hook "Normal window switch: $window_title"
      ;;
    recovery)
      # Enable all windows
      log_hook "Recovery mode: allowing $window_title"
      ;;
  esac
}

function on_window_create() {
  local window_title="$1"
  local current_state=$(get_flow_state)
  
  log_hook "Window create: $window_title (State: $current_state)"
  
  case "$current_state" in
    deep)
      # Limit new windows
      if [[ "$window_title" =~ (email|slack|discord) ]]; then
        log_hook "Blocking new window: $window_title"
        exit 1
      fi
      ;;
    normal)
      # Allow new windows
      log_hook "New window allowed: $window_title"
      ;;
    recovery)
      # Enable all windows
      log_hook "Recovery mode: allowing new window $window_title"
      ;;
  esac
}

function on_window_close() {
  local window_title="$1"
  local current_state=$(get_flow_state)
  
  log_hook "Window close: $window_title (State: $current_state)"
  
  case "$current_state" in
    deep)
      # Preserve context
      "$FLOW_MGR" --save-context "$window_title"
      ;;
    normal)
      # Track patterns
      "$FLOW_MGR" --save-pattern "close:$window_title"
      ;;
    recovery)
      # Enable cleanup
      log_hook "Recovery mode: cleaning up $window_title"
      ;;
  esac
}

# Main hook handler
case "$1" in
  --focus)
    on_window_focus "$2"
    ;;
  --create)
    on_window_create "$2"
    ;;
  --close)
    on_window_close "$2"
    ;;
  --status)
    echo "Current flow state: $(get_flow_state)"
    tail -n 10 "$FLOW_LOG"
    ;;
  *)
    echo "Usage: $0 {--focus|--create|--close|--status} window_title"
    exit 1
    ;;
esac

exit 0
