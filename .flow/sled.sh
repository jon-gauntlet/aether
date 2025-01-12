#!/bin/bash

# Development Sled - Optimized for Speed, Protection, and Flow

# Speed optimizations
alias f='npm run flow'
alias t='npm run test'
alias d='npm run dev'
alias b='npm run build'
alias p='npm run protect'

# Protection mechanisms
function backup_state() {
  local timestamp=$(date +%Y%m%d_%H%M%S)
  mkdir -p .flow/backups/$timestamp
  cp -r src .flow/backups/$timestamp/
  git add .
  git commit -m "chore: auto-backup $timestamp" || true
  echo "State backed up to .flow/backups/$timestamp"
}

function restore_state() {
  local latest=$(ls -t .flow/backups | head -n 1)
  if [ -n "$latest" ]; then
    cp -r .flow/backups/$latest/src .
    echo "State restored from .flow/backups/$latest"
  else
    echo "No backups found"
  fi
}

# Flow preservation
function save_session() {
  local timestamp=$(date +%Y%m%d_%H%M%S)
  echo "Saving session state..."
  # Save git status
  git status > .flow/sessions/${timestamp}_git.log
  # Save npm status
  npm list > .flow/sessions/${timestamp}_deps.log
  # Save terminal history
  history > .flow/sessions/${timestamp}_history.log
  echo "Session saved to .flow/sessions/$timestamp"
}

function load_session() {
  local latest=$(ls -t .flow/sessions/*_git.log | head -n 1 | sed 's/_git.log//')
  if [ -n "$latest" ]; then
    echo "Loading session from $latest..."
    cat ${latest}_history.log | tail -n 50
    cat ${latest}_git.log
    echo "Session loaded"
  else
    echo "No sessions found"
  fi
}

# Flow state management
function start_flow() {
  echo "Starting flow session..."
  backup_state
  npm run dev &
  npm run test -- --watch &
  npm run type:watch &
  echo "Flow environment ready"
}

function end_flow() {
  echo "Preserving flow state..."
  save_session
  pkill -f "npm run (dev|test|type:watch)"
  echo "Flow state preserved"
}

function recover_flow() {
  echo "Recovering flow state..."
  restore_state
  load_session
  start_flow
  echo "Flow recovered"
}

# Error handling
function handle_error() {
  echo "Error detected, preserving state..."
  backup_state
  save_session
}

trap handle_error ERR

# Auto-completion
complete -W "start_flow end_flow recover_flow backup_state restore_state save_session load_session" -f flow

# Usage instructions
echo "Development Sled Ready!"
echo "Commands:"
echo "  start_flow    - Start development environment"
echo "  end_flow      - Save state and clean up"
echo "  recover_flow  - Restore previous state"
echo "  f             - Run flow commands"
echo "  t             - Run tests"
echo "  d             - Start dev server"
echo "  b             - Build project"
echo "  p             - Run protection" 