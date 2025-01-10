#!/usr/bin/env bash

# Gauntlet System Optimization Script
# Integrates and optimizes all invisible infrastructure components

set -euo pipefail

# Configuration
GAUNTLET_ROOT="$HOME/.gauntlet"
BRAIN_ROOT="$HOME/brain"
WORKSPACE_ROOT="$HOME/workspace"
SCRIPTS_ROOT="$HOME/scripts"

# Ensure critical directories exist
declare -a DIRS=(
    "$GAUNTLET_ROOT/system"
    "$GAUNTLET_ROOT/context"
    "$GAUNTLET_ROOT/metrics"
    "$GAUNTLET_ROOT/state"
    "$GAUNTLET_ROOT/logs"
    "$GAUNTLET_ROOT/cache"
    "$BRAIN_ROOT/maps"
    "$BRAIN_ROOT/knowledge"
    "$BRAIN_ROOT/context"
)

for dir in "${DIRS[@]}"; do
    mkdir -p "$dir"
done

# System optimization functions
optimize_environment() {
    # Set up environment variables for optimal performance
    export GAUNTLET_OPTIMIZE_LEVEL=3
    export GAUNTLET_FOCUS_MODE=1
    export GAUNTLET_AUTO_RECOVERY=1
}

setup_monitoring() {
    # Create monitoring directory if it doesn't exist
    mkdir -p "$GAUNTLET_ROOT/metrics/monitoring"
    
    # Initialize monitoring files
    touch "$GAUNTLET_ROOT/metrics/monitoring/focus_states.log"
    touch "$GAUNTLET_ROOT/metrics/monitoring/performance.log"
    touch "$GAUNTLET_ROOT/metrics/monitoring/energy_levels.log"
}

configure_focus_protection() {
    # Set up focus protection rules
    cat > "$GAUNTLET_ROOT/system/focus_rules.conf" << EOF
# Focus Protection Rules
BLOCK_NOTIFICATIONS=1
PRESERVE_CONTEXT=1
AUTO_SAVE_INTERVAL=300
FLOW_STATE_THRESHOLD=45
EOF
}

optimize_workspace() {
    # Create workspace optimization symlinks
    ln -sf "$SCRIPTS_ROOT/gauntlet/focus-mode-manager" "$HOME/bin/focus"
    ln -sf "$SCRIPTS_ROOT/g_command.sh" "$HOME/bin/g"
    
    # Set up workspace state tracking
    mkdir -p "$GAUNTLET_ROOT/state/workspace"
    touch "$GAUNTLET_ROOT/state/workspace/last_context"
}

setup_recovery_protocols() {
    # Initialize recovery protocols
    mkdir -p "$GAUNTLET_ROOT/system/recovery"
    
    cat > "$GAUNTLET_ROOT/system/recovery/protocol.sh" << EOF
#!/usr/bin/env bash
# Recovery Protocol Handler
save_context() {
    date > "$GAUNTLET_ROOT/state/last_recovery"
    cp -r "$GAUNTLET_ROOT/context/current" "$GAUNTLET_ROOT/context/backup/\$(date +%Y%m%d_%H%M%S)"
}
restore_context() {
    latest=\$(ls -t "$GAUNTLET_ROOT/context/backup/" | head -n1)
    if [ -n "\$latest" ]; then
        cp -r "$GAUNTLET_ROOT/context/backup/\$latest" "$GAUNTLET_ROOT/context/current"
    fi
}
EOF
    chmod +x "$GAUNTLET_ROOT/system/recovery/protocol.sh"
}

main() {
    echo "Starting Gauntlet system optimization..."
    
    optimize_environment
    setup_monitoring
    configure_focus_protection
    optimize_workspace
    setup_recovery_protocols
    
    echo "System optimization complete. Run 'focus start' to begin a focused session."
}

main "$@" 