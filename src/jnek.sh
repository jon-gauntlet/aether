#!/bin/bash

# Cursor Optimization Setup Script
# Run with: sudo ./01_cursor_optimization.sh

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

echo "Setting up Cursor optimization..."

# 1. Install required packages
pacman -Sy --noconfirm \
    fuse2 \
    fuse3 \
    base-devel \
    git \
    || true

# 2. Create required directories
mkdir -p /etc/systemd/system
mkdir -p "$USER_HOME/.cursor/mount"
mkdir -p "$USER_HOME/workspace"

# 3. Set up Cursor service
cat > /etc/systemd/system/cursor-agent.service << EOF
[Unit]
Description=Cursor AI Agent Service
After=network.target
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
Environment="CURSOR_AGENT_PRIVILEGED=1"
Environment="CURSOR_YOLO_MODE=1"
Environment="CURSOR_AGENT_NO_CONFIRM=1"
Environment="CURSOR_DISABLE_TELEMETRY=1"
Environment="CURSOR_WORKSPACE=$USER_HOME/workspace"
Environment="CURSOR_LOG_LEVEL=error"
Environment="FUSE_MOUNT_POINT=$USER_HOME/.cursor/mount"
ExecStartPre=/bin/sh -c 'mkdir -p \${FUSE_MOUNT_POINT}'
ExecStart=/usr/bin/cursor --appimage-extract-and-run --enable-features=UseOzonePlatform --ozone-platform=wayland --agent-mode --disable-gpu-sandbox --enable-gpu-rasterization --enable-zero-copy
ExecStartPost=/bin/sh -c 'chmod -R u+rw \${FUSE_MOUNT_POINT}'
Restart=always
RestartSec=10
TimeoutStartSec=0
CPUQuota=100%
MemoryHigh=8G
IOWeight=100
Nice=-10

[Install]
WantedBy=default.target
EOF

# 4. Set up sudoers configuration
cat > /etc/sudoers.d/99-cursor << EOF
# Allow Cursor to execute specific commands without password
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/pacman
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/journalctl
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /bin/mount
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /bin/umount
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/fusermount
EOF

# 5. Set correct permissions
chmod 644 /etc/systemd/system/cursor-agent.service
chmod 440 /etc/sudoers.d/99-cursor
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/.cursor"
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/workspace"

# 6. Create fuse group and add user
groupadd -f fuse
usermod -aG fuse "$ORIGINAL_USER"

# 7. Enable and start services
systemctl daemon-reload
systemctl enable --now cursor-agent.service

# 8. Move this script to applied directory after successful execution
mv "$0" "$USER_HOME/scripts/system_changes/applied/"

echo "Cursor optimization complete. Please log out and back in for group changes to take effect." 