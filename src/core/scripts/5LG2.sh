#!/bin/bash

# Invisible Infrastructure Integration System

# Root directories
INFRA_ROOT="$HOME/.cursor"
SYSTEM_ROOT="$HOME/scripts/system_changes"
GAUNTLET_ROOT="$HOME/.gauntlet"
CONTEXT_ROOT="$INFRA_ROOT/contexts"
BRIDGE_ROOT="$INFRA_ROOT/bridge"

# Ensure all directories exist
mkdir -p "$INFRA_ROOT"/{contexts,bridge,services,hooks,state,logs,metrics}
mkdir -p "$CONTEXT_ROOT"/{system,project,sacred,user,temp}
mkdir -p "$BRIDGE_ROOT"/{active,archive}
mkdir -p "$GAUNTLET_ROOT"/{contexts,metrics,cache}

# Integration functions
integrate_contexts() {
  # Integrate Cursor contexts
  find "$CONTEXT_ROOT" -type f -name "*.ctx" -exec cat {} + > "$BRIDGE_ROOT/active/cursor.ctx"

  # Integrate Gauntlet contexts
  find "$GAUNTLET_ROOT/contexts" -type f -name "*.ctx" -exec cat {} + > "$BRIDGE_ROOT/active/gauntlet.ctx"

  # Create unified context
  cat "$BRIDGE_ROOT/active"/*.ctx > "$BRIDGE_ROOT/active/unified.ctx"
}

optimize_contexts() {
  # Deduplicate and organize contexts
  sort -u "$BRIDGE_ROOT/active/unified.ctx" > "$BRIDGE_ROOT/active/unified.ctx.tmp"
  mv "$BRIDGE_ROOT/active/unified.ctx.tmp" "$BRIDGE_ROOT/active/unified.ctx"

  # Archive old contexts
  find "$BRIDGE_ROOT/active" -type f -mmin +60 -exec mv {} "$BRIDGE_ROOT/archive/" \;
}

integrate_services() {
  # Start Cursor infrastructure
  systemctl --user try-restart cursor-infrastructure.service

  # Start Gauntlet services
  systemctl --user try-restart gauntlet-optimizer.service
  systemctl --user try-restart gauntlet-metrics.service
  systemctl --user try-restart aether-dev.service
}

monitor_health() {
  # Check service health
  systemctl --user --no-pager status cursor-infrastructure.service
  systemctl --user --no-pager status gauntlet-optimizer.service
  systemctl --user --no-pager status gauntlet-metrics.service
  systemctl --user --no-pager status aether-dev.service

  # Log health metrics
  date +"%Y-%m-%d %H:%M:%S" >> "$GAUNTLET_ROOT/metrics/health.log"
  systemctl --user list-units --state=failed >> "$GAUNTLET_ROOT/metrics/health.log"
}

# Main integration loop
while true; do
  # Integrate contexts
  integrate_contexts

  # Optimize contexts
  optimize_contexts

  # Integrate services
  integrate_services

  # Monitor health
  monitor_health

  # Sleep for a short period
  sleep 30
done
