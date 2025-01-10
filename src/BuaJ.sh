#!/bin/bash

# Install Cursor Context Management Services
# This script must be run as root

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

# Get the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

# Install service files from prepared location
cp ${USER_HOME}/.config/cursor/services/cursor-context.slice /etc/systemd/system/
cp ${USER_HOME}/.config/cursor/services/cursor-semantic-indexer.service /etc/systemd/system/
cp ${USER_HOME}/.config/cursor/services/cursor-context-optimizer.service /etc/systemd/system/

# Set ownership of user directories
chown -R ${ORIGINAL_USER}:${ORIGINAL_USER} ${USER_HOME}/.config/cursor
chown -R ${ORIGINAL_USER}:${ORIGINAL_USER} ${USER_HOME}/.local/share/cursor

# Reload systemd
systemctl daemon-reload

# Enable and start services
systemctl enable --now cursor-context.slice
systemctl enable --now cursor-semantic-indexer.service
systemctl enable --now cursor-context-optimizer.service

echo "Context management services installed and started"
echo "Check status with: systemctl status cursor-*" 