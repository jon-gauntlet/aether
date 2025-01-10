#!/bin/bash

echo "This script will set up Cursor and system optimizations."
echo "Please run it with: sudo ./setup_cursor.sh"
echo
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Create all required files in home directory first
mkdir -p ~/cursor_setup_temp
cd ~/cursor_setup_temp

cat > cursor-agent.service << 'EOF'
[Unit]
Description=Cursor AI Agent Service
After=network.target
Wants=system-ai.slice

[Service]
Type=simple
User=jon
Group=jon
Environment="CURSOR_AGENT_PRIVILEGED=1"
Environment="CURSOR_YOLO_MODE=1"
Environment="CURSOR_AGENT_NO_CONFIRM=1"
Environment="CURSOR_DISABLE_TELEMETRY=1"
Environment="CURSOR_WORKSPACE=/home/jon/workspace"
Environment="CURSOR_LOG_LEVEL=error"
ExecStart=/usr/bin/cursor --appimage-extract-and-run --enable-features=UseOzonePlatform --ozone-platform=wayland --agent-mode
Restart=always
RestartSec=10
TimeoutStartSec=0
Slice=system-ai.slice
CPUQuota=100%
MemoryHigh=8G
IOWeight=100

[Install]
WantedBy=default.target
EOF

# Create a script to apply all changes with sudo
cat > apply_changes.sh << 'EOF'
#!/bin/bash

# Must run as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Install required packages
pacman -Sy --noconfirm fuse2 fuse3 || true

# Create fuse group if it doesn't exist
groupadd -f fuse

# Add user to fuse group
usermod -aG fuse jon

# Set up system files
cp cursor-agent.service /etc/systemd/system/
chmod 644 /etc/systemd/system/cursor-agent.service

# Create workspace directory
mkdir -p /home/jon/workspace
chown -R jon:jon /home/jon/workspace

# Set up sudoers
echo "jon ALL=(ALL) NOPASSWD: /usr/bin/pacman, /usr/bin/systemctl, /usr/bin/journalctl" > /etc/sudoers.d/99-cursor
chmod 440 /etc/sudoers.d/99-cursor

# Reload systemd
systemctl daemon-reload
systemctl enable --now cursor-agent.service

echo "Setup complete. You can now start Cursor normally."
EOF

chmod +x apply_changes.sh

echo "Files prepared. Now run: sudo ./cursor_setup_temp/apply_changes.sh" 