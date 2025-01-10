#!/bin/bash

# Cursor Context System Integration
# Integrates the new context management system with existing infrastructure

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})
GAUNTLET_HOME="$USER_HOME/.gauntlet"
CURSOR_HOME="$USER_HOME/.config/cursor"
CURSOR_DATA="$USER_HOME/.local/share/cursor"
SYSTEM_OPS_DIR="$USER_HOME/workspace/system-ops"

echo "Integrating context management system..."

# 1. Link Gauntlet context into Cursor context structure
mkdir -p "$GAUNTLET_HOME/context"
ln -sf "$GAUNTLET_HOME/context" "$CURSOR_HOME/contexts/gauntlet"

# 2. Create unified context index
cat > /usr/local/bin/unified-context-indexer << 'EOF'
#!/bin/bash
source /etc/gauntlet/optimizer.env

# Index all context sources
find "$GAUNTLET_HOME/context" "$CURSOR_HOME/contexts" -type f \
    -not -path "*/\.*" \
    -exec sh -c '
        file="$1"
        modified=$(stat -c %Y "$file")
        type=$(basename "$(dirname "$file")")
        echo "$file|$type|$modified|$(sha256sum "$file" | cut -d" " -f1)"
    ' sh {} \; | sort -t"|" -k2,2 -k3,3nr > "$CURSOR_HOME/state/unified_context_index"
EOF

chmod +x /usr/local/bin/unified-context-indexer

# 3. Create context bridge service
cat > /etc/systemd/system/cursor-context-bridge.service << EOF
[Unit]
Description=Cursor Context Bridge Service
After=cursor-agent.service gauntlet-optimizer.service
Wants=cursor-agent.service gauntlet-optimizer.service
PartOf=cursor-context.slice

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
Environment=CURSOR_CONTEXT_ROOT=$CURSOR_HOME
Environment=CURSOR_DATA_ROOT=$CURSOR_DATA
Environment=GAUNTLET_HOME=$GAUNTLET_HOME
ExecStart=/home/jon/scripts/cursor/context_bridge.sh
Restart=always
RestartSec=10
Nice=10
CPUWeight=20
IOWeight=20
MemoryHigh=1G

[Install]
WantedBy=multi-user.target
EOF

# 4. Update Gauntlet optimizer to use context system
patch_optimizer() {
    local file="/usr/local/bin/gauntlet-optimizer"
    # Add context system integration
    sed -i '/# 2. Project Context Preservation/a\
    # Integrate with Cursor context system\
    /usr/local/bin/unified-context-indexer\
    find "${CURSOR_WORKSPACE}" -type f -name "*.md" -mtime -1 -exec cp {} "${CURSOR_HOME}/contexts/projects/" \; 2>/dev/null || true\
    ' "$file"
}

# 5. Update workspace state tracker
patch_workspace_tracker() {
    local file="$SYSTEM_OPS_DIR/scripts/workspace_state.sh"
    # Add context tracking
    sed -i '/while true; do/a\
    # Track context changes\
    /usr/local/bin/unified-context-indexer\
    find ~/.cursor -type f -name "context_*.log" -mmin -5 > ~/.cursor/recent_context_changes.txt\
    ' "$file"
}

# 6. Create context optimization timer
cat > /etc/systemd/system/cursor-context-optimizer.timer << EOF
[Unit]
Description=Cursor Context Optimization Timer
Requires=cursor-context-optimizer.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
RandomizedDelaySec=300
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 7. Update system-ai.slice for context services
patch_system_ai_slice() {
    local file="/etc/systemd/system/system-ai.slice"
    # Add context-specific settings
    sed -i '/CPUWeight=100/a\
# Context system settings\
MemoryLow=2G\
MemoryHigh=8G\
IOWeight=90\
' "$file"
}

# Apply patches
patch_optimizer
patch_workspace_tracker
patch_system_ai_slice

# Reload systemd and enable new services
systemctl daemon-reload
systemctl enable --now cursor-context-optimizer.timer
systemctl restart system-ai.slice
systemctl restart gauntlet-optimizer.service
systemctl restart cursor-workspace-state.service

echo "Context management system integration complete."
echo "The system now provides:"
echo "1. Unified context indexing across all sources"
echo "2. Seamless integration with Gauntlet optimization"
echo "3. Workspace-aware context tracking"
echo "4. Automatic context optimization"
echo "5. Resource-managed context services" 