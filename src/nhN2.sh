#!/bin/bash
# Setup Context Services
# This script sets up and manages the context services for the invisible infrastructure.

# Core paths
WORKSPACE="/home/jon/workspace/gauntlet"
BRAIN_DIR="/home/jon/brain"
CONFIG_DIR="/home/jon/.config/cursor"
LOCAL_STATE="/home/jon/.local/state/cursor"
LOCAL_SHARE="/home/jon/.local/share/cursor"

# Service paths
AUTONOMIC_MGR="/home/jon/scripts/cursor/autonomic-manager"
META_LEARNER="/home/jon/scripts/cursor/meta-learner"
ESSENCE_HARM="/home/jon/scripts/cursor/essence-harmonizer"
FLOW_MGR="/home/jon/scripts/cursor/flow-manager"
SACRED_MGR="/home/jon/scripts/cursor/sacred-manager"
ENERGY_MGR="/home/jon/scripts/cursor/energy-manager"

# State paths
PATTERN_DB="$LOCAL_SHARE/autonomic/patterns/pattern_database.json"
CONTEXT_CACHE="$LOCAL_SHARE/essence/context.cache"
SESSION_DIR="$LOCAL_SHARE/crystallized"
FLOW_STATE="$LOCAL_STATE/flow"
CONTEXT_STATE="$LOCAL_STATE/context"
PATTERN_STATE="$LOCAL_STATE/patterns"

# Validation functions
function validate_paths() {
  echo "Validating paths..."
  for path in $WORKSPACE $BRAIN_DIR $CONFIG_DIR $LOCAL_STATE $LOCAL_SHARE; do
    if [[ ! -d "$path" ]]; then
      echo "Creating: $path"
      mkdir -p "$path"
    fi
  done
}

function check_services() {
  echo "Checking services..."
  ps aux | grep -E "autonomic|meta|essence|flow|sacred|energy" | grep -v grep
}

function verify_state() {
  echo "Verifying state..."
  for path in $PATTERN_DB $CONTEXT_CACHE; do
    if [[ ! -f "$path" ]]; then
      echo "Creating: $path"
      mkdir -p "$(dirname "$path")"
      echo "{}" > "$path"
    fi
  done
}

# Service management
function start_services() {
  echo "Starting services..."
  for service in $AUTONOMIC_MGR $META_LEARNER $ESSENCE_HARM $FLOW_MGR $SACRED_MGR $ENERGY_MGR; do
    if [[ -x "$service" ]]; then
      echo "Starting: $service"
      nohup "$service" &>/dev/null &
    else
      echo "Warning: $service not executable"
    fi
  done
}

function stop_services() {
  echo "Stopping services..."
  pkill -f "autonomic|meta|essence|flow|sacred|energy"
}

function restart_services() {
  stop_services
  start_services
}

# State management
function backup_state() {
  echo "Backing up state..."
  for path in $PATTERN_DB $CONTEXT_CACHE; do
    if [[ -f "$path" ]]; then
      cp "$path"{,.backup}
    fi
  done
}

function restore_state() {
  echo "Restoring state..."
  for path in $PATTERN_DB $CONTEXT_CACHE; do
    if [[ -f "$path.backup" ]]; then
      cp "$path"{.backup,}
    fi
  done
}

# Main logic
case "$1" in
  --start)
    validate_paths
    verify_state
    start_services
    ;;
  --stop)
    stop_services
    ;;
  --restart)
    validate_paths
    verify_state
    restart_services
    ;;
  --reset)
    validate_paths
    backup_state
    stop_services
    verify_state
    start_services
    ;;
  --rebuild)
    validate_paths
    backup_state
    stop_services
    verify_state
    restore_state
    start_services
    ;;
  --status)
    validate_paths
    verify_state
    check_services
    ;;
  *)
    echo "Usage: $0 {--start|--stop|--restart|--reset|--rebuild|--status}"
    exit 1
    ;;
esac

exit 0 