#!/bin/bash

# Install Cursor Context Management Services
# This script must be run as root

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

# Create necessary directories
mkdir -p /home/jon/.config/cursor/{contexts/{system,general,projects,sacred},state,bridges}
mkdir -p /home/jon/.local/share/cursor/{indexes,cache,logs}
chown -R jon:jon /home/jon/.config/cursor /home/jon/.local/share/cursor

# Install service files
cp cursor-context.slice /etc/systemd/system/
cp cursor-semantic-indexer.service /etc/systemd/system/
cp cursor-context-optimizer.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable and start services
systemctl enable --now cursor-context.slice
systemctl enable --now cursor-semantic-indexer.service
systemctl enable --now cursor-context-optimizer.service

echo "Context management services installed and started"
echo "Check status with: systemctl status cursor-*" 