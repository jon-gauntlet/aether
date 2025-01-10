#!/bin/bash

# Setup script for Cursor context preservation services
set -euo pipefail

# Ensure directories exist
mkdir -p ~/.config/systemd/user
mkdir -p ~/.local/state/cursor
mkdir -p ~/.local/share/cursor/crystallized
mkdir -p ~/.config/cursor/contexts/{system,general,projects,sacred,gauntlet}

# Make context crystallizer executable
chmod +x ~/scripts/cursor/context-crystallizer

# Install service files
cp ~/scripts/cursor/context-crystallizer.service ~/.config/systemd/user/
cp ~/scripts/cursor/essence-integrator.service ~/.config/systemd/user/

# Reload systemd user daemon
systemctl --user daemon-reload

# Enable and start services
systemctl --user enable --now context-crystallizer.service
systemctl --user enable --now essence-integrator.service

# Create cursor-context slice if it doesn't exist
if ! systemctl --user status cursor-context.slice >/dev/null 2>&1; then
    cat > ~/.config/systemd/user/cursor-context.slice <<EOF
[Unit]
Description=Cursor Context Management Slice
Documentation=https://sre.google/sre-book/table-of-contents/

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=8G
TasksMax=100
EOF
    systemctl --user daemon-reload
fi

# Enable slice
systemctl --user enable --now cursor-context.slice

echo "Context preservation services installed and started"
echo "Checking status..."

systemctl --user status cursor-context.slice
systemctl --user status context-crystallizer.service
systemctl --user status essence-integrator.service 