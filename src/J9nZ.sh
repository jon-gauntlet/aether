#!/bin/bash

# Setup script for Cursor context preservation services
set -euo pipefail

# Ensure directories exist
mkdir -p ~/.config/systemd/user
mkdir -p ~/.local/state/cursor/{autonomic,backups,processed}
mkdir -p ~/.local/share/cursor/{crystallized,cache,logs,state}
mkdir -p ~/.config/cursor/contexts/{system,general,projects,sacred,gauntlet}

# Make scripts executable
chmod +x ~/scripts/cursor/context-crystallizer
chmod +x ~/scripts/cursor/autonomic-manager

# Create cursor-autonomic slice
cat > ~/.config/systemd/user/cursor-autonomic.slice <<EOF
[Unit]
Description=Cursor Autonomic Resource Management
Documentation=https://sre.google/sre-book/table-of-contents/
Before=cursor-context.slice

[Slice]
CPUWeight=95
IOWeight=95
MemoryHigh=12G
MemoryMax=14G
TasksMax=200

# Autonomic Controls
ResourceControl=true
ResourcePolicy=balanced
Delegate=true
EOF

# Create cursor-context slice
cat > ~/.config/systemd/user/cursor-context.slice <<EOF
[Unit]
Description=Cursor Context Management Slice
Documentation=https://sre.google/sre-book/table-of-contents/
After=cursor-autonomic.slice

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=8G
TasksMax=100
EOF

# Install service files
cp ~/scripts/cursor/context-crystallizer.service ~/.config/systemd/user/
cp ~/scripts/cursor/essence-integrator.service ~/.config/systemd/user/
cp ~/scripts/cursor/autonomic-manager.service ~/.config/systemd/user/

# Initialize learning state
if [[ ! -f ~/.local/state/cursor/autonomic/learning.json ]]; then
    echo '{
        "patterns": [],
        "last_updated": 0,
        "version": 1
    }' > ~/.local/state/cursor/autonomic/learning.json
fi

# Reload systemd user daemon
systemctl --user daemon-reload

# Enable and start services in correct order
systemctl --user enable --now cursor-autonomic.slice
systemctl --user enable --now cursor-context.slice
systemctl --user enable --now autonomic-manager.service
systemctl --user enable --now context-crystallizer.service
systemctl --user enable --now essence-integrator.service

echo "Context preservation and autonomic management services installed and started"
echo "Checking status..."

systemctl --user status cursor-autonomic.slice
systemctl --user status cursor-context.slice
systemctl --user status autonomic-manager.service
systemctl --user status context-crystallizer.service
systemctl --user status essence-integrator.service 