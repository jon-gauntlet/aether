#!/bin/bash

# Exit on error
set -euo pipefail

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})
CHATGENIUS_DIR="$USER_HOME/projects/chatgenius"
GAUNTLET_HOME="$CHATGENIUS_DIR/.gauntlet"

# Create service file
sudo tee /etc/systemd/system/chatgenius-dev.service << EOF
[Unit]
Description=ChatGenius Development Environment
After=network.target gauntlet-optimizer.service gauntlet-metrics.service
Wants=gauntlet-optimizer.service gauntlet-metrics.service
ConditionPathExists=/etc/gauntlet/chatgenius.env
ConditionPathExists=/usr/local/bin/chatgenius-monitor

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
EnvironmentFile=/etc/gauntlet/chatgenius.env
WorkingDirectory=$CHATGENIUS_DIR
ExecStartPre=/bin/mkdir -p $GAUNTLET_HOME/logs
ExecStart=/usr/local/bin/chatgenius-monitor
Restart=always
RestartSec=10
CPUWeight=90
IOWeight=90
MemoryHigh=2G
TasksMax=100

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
sudo chown root:root /etc/systemd/system/chatgenius-dev.service
sudo chmod 644 /etc/systemd/system/chatgenius-dev.service

# Reload systemd
sudo systemctl daemon-reload 