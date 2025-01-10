#!/bin/bash

# Cursor Workspace Optimization for System Operations
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

# Create a dedicated system operations workspace
SYSTEM_OPS_DIR="$USER_HOME/workspace/system-ops"
mkdir -p "$SYSTEM_OPS_DIR"/{scripts,configs,logs,state}

# Create symlinks to important system directories
ln -sf /etc "$SYSTEM_OPS_DIR/configs/etc"
ln -sf /usr/lib/systemd "$SYSTEM_OPS_DIR/configs/systemd"
ln -sf "$USER_HOME/scripts" "$SYSTEM_OPS_DIR/scripts/user"

# Create a .cursorrules file for optimized indexing
cat > "$SYSTEM_OPS_DIR/.cursorrules" << EOF
# System Operations Workspace Rules
editor.formatOnSave: true
search.exclude:
  "**/*.log": true
  "**/proc/**": true
  "**/sys/**": true
  "**/dev/**": true
  "**/run/**": true
  "**/tmp/**": true
  "**/var/cache/**": true
  "**/var/tmp/**": true
  "**/lost+found": true
index.include:
  - "/etc/systemd/**"
  - "/etc/gauntlet/**"
  - "/home/jon/scripts/**"
  - "/usr/lib/systemd/system/**"
EOF

# Set ownership
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$SYSTEM_OPS_DIR"

# Update Cursor agent service to recognize the system ops workspace
sed -i "/Environment=\"CURSOR_WORKSPACE/a Environment=\"CURSOR_SYSTEM_OPS=$SYSTEM_OPS_DIR\"" /etc/systemd/system/cursor-agent.service

# Create a workspace state tracker
cat > "$SYSTEM_OPS_DIR/scripts/workspace_state.sh" << 'EOF'
#!/bin/bash
while true; do
    find /etc -type f -mmin -60 > ~/.cursor/recent_system_changes.txt
    sleep 300
done
EOF
chmod +x "$SYSTEM_OPS_DIR/scripts/workspace_state.sh"

# Create a systemd service for workspace state tracking
cat > /etc/systemd/system/cursor-workspace-state.service << EOF
[Unit]
Description=Cursor Workspace State Tracker
After=cursor-agent.service
Wants=cursor-agent.service

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
ExecStart=$SYSTEM_OPS_DIR/scripts/workspace_state.sh
Restart=always
RestartSec=10
Nice=19
CPUWeight=10
IOWeight=10
MemoryHigh=512M

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl daemon-reload
systemctl enable --now cursor-workspace-state.service

echo "Cursor workspace optimization complete."
echo "For system-wide operations:"
echo "1. Open Cursor in $SYSTEM_OPS_DIR instead of /"
echo "2. All relevant system files are symlinked"
echo "3. Indexing is optimized to exclude unnecessary paths"
echo "4. System changes are tracked efficiently" 