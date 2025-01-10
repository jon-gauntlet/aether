#!/bin/bash
# Migration script to rename chatgenius to aether
# Must be run with sudo

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})
WORKSPACE_ROOT="/home/jon/workspace/system-ops"
CONFIG_ROOT="$WORKSPACE_ROOT/configs"

echo "Starting migration from chatgenius to aether..."

# Create necessary directories
mkdir -p "$CONFIG_ROOT/etc/systemd/system"
mkdir -p "$CONFIG_ROOT/etc/gauntlet"
mkdir -p "$CONFIG_ROOT/systemd/system-sleep"

# 1. Update and install service files
echo "Updating service files..."
SERVICE_CONTENT=$(cat << 'EOF'
[Unit]
Description=Aether Development Environment
After=network.target gauntlet-optimizer.service gauntlet-metrics.service
Wants=gauntlet-optimizer.service gauntlet-metrics.service
ConditionPathExists=/etc/gauntlet/aether.env
ConditionPathExists=/usr/local/bin/aether-monitor

[Service]
Type=simple
User=jon
Group=jon
Environment="CURSOR_PROJECT=/home/jon/projects/aether"
EnvironmentFile=/etc/gauntlet/aether.env
WorkingDirectory=/home/jon/projects/aether
ExecStartPre=/bin/mkdir -p /home/jon/projects/aether/.gauntlet/logs
ExecStart=/usr/local/bin/aether-monitor
Restart=always
RestartSec=10
CPUWeight=90
IOWeight=90
MemoryHigh=2G
TasksMax=100
Slice=aether.slice

[Install]
WantedBy=multi-user.target
EOF
)

echo "$SERVICE_CONTENT" > "$CONFIG_ROOT/etc/systemd/system/aether-dev.service"
echo "$SERVICE_CONTENT" > "/etc/systemd/system/aether-dev.service"
rm -f "$CONFIG_ROOT/etc/systemd/system/chatgenius-dev.service"
rm -f "/etc/systemd/system/chatgenius-dev.service"

# 2. Update and install environment file
echo "Updating environment file..."
ENV_CONTENT=$(cat << EOF
CURSOR_PROJECT=/home/jon/projects/aether
GAUNTLET_HOME=/home/jon/projects/aether/.gauntlet
HOME=/home/jon
EOF
)

mkdir -p "/etc/gauntlet"
echo "$ENV_CONTENT" > "$CONFIG_ROOT/etc/gauntlet/aether.env"
echo "$ENV_CONTENT" > "/etc/gauntlet/aether.env"
rm -f "$CONFIG_ROOT/etc/gauntlet/chatgenius.env"
rm -f "/etc/gauntlet/chatgenius.env"

# 3. Update and install slice configuration
echo "Updating slice configuration..."
SLICE_CONTENT=$(cat << EOF
[Unit]
Description=Aether Project Slice
Before=slices.target
After=system-ai.slice

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=8G
TasksMax=infinity

[Install]
WantedBy=slices.target
EOF
)

echo "$SLICE_CONTENT" > "$CONFIG_ROOT/etc/systemd/system/aether.slice"
echo "$SLICE_CONTENT" > "/etc/systemd/system/aether.slice"
rm -f "$CONFIG_ROOT/etc/systemd/system/chatgenius.slice"
rm -f "/etc/systemd/system/chatgenius.slice"

# 4. Update and install system sleep script
echo "Updating system sleep script..."
SLEEP_CONTENT=$(cat << 'EOF'
#!/bin/bash

case $1 in
    post)
        echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
        echo 1 > /proc/sys/vm/swappiness
        echo 1000 > /proc/sys/vm/vfs_cache_pressure
        systemctl restart gauntlet-optimizer.service
        systemctl restart gauntlet-metrics.service
        systemctl restart aether-dev.service
        ;;
esac
EOF
)

mkdir -p "/usr/lib/systemd/system-sleep"
echo "$SLEEP_CONTENT" > "$CONFIG_ROOT/systemd/system-sleep/gauntlet-resume"
echo "$SLEEP_CONTENT" > "/usr/lib/systemd/system-sleep/gauntlet-resume"
chmod +x "$CONFIG_ROOT/systemd/system-sleep/gauntlet-resume"
chmod +x "/usr/lib/systemd/system-sleep/gauntlet-resume"

# 5. Update monitor script
echo "Updating monitor script..."
MONITOR_CONTENT=$(cat << 'EOF'
#!/bin/bash
# Aether Development Monitor

# Source environment
source /etc/gauntlet/aether.env

# Set up logging
exec 1> >(tee -a "${GAUNTLET_HOME}/logs/monitor.log")
exec 2>&1

echo "Starting Aether monitor at $(date)"

# Monitor project files
while true; do
    # Monitor project files
    inotifywait -r -e modify,create,delete "${CURSOR_PROJECT}"

    # Update project context
    find "${CURSOR_PROJECT}" -type f -name "*.md" -exec cat {} + > "${GAUNTLET_HOME}/context/documentation.txt"
    find "${CURSOR_PROJECT}" -type f -name "*.json" -exec cat {} + > "${GAUNTLET_HOME}/context/config.txt"

    # Collect metrics
    git -C "${CURSOR_PROJECT}" status --porcelain > "${GAUNTLET_HOME}/metrics/git_status.txt"
    git -C "${CURSOR_PROJECT}" log --since="1 day ago" --pretty=format:"%h %s" > "${GAUNTLET_HOME}/metrics/recent_commits.txt"

    # Brief pause to prevent excessive updates
    sleep 1
done
EOF
)

echo "$MONITOR_CONTENT" > "/usr/local/bin/aether-monitor"
chmod +x "/usr/local/bin/aether-monitor"

# 6. Clean up old files
echo "Cleaning up old files..."
rm -f "/etc/systemd/system/default.target.wants/chatgenius-dev.service"
rm -f "$CONFIG_ROOT/etc/systemd/system/default.target.wants/chatgenius-dev.service"

# 7. Update file ownership
echo "Updating file permissions..."
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$WORKSPACE_ROOT"

# 8. Move actual project directory if it exists
if [ -d "/home/jon/projects/chatgenius" ]; then
    echo "Moving project directory..."
    mv "/home/jon/projects/chatgenius" "/home/jon/projects/aether"
    chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "/home/jon/projects/aether"
fi

# 9. Create project directories if they don't exist
echo "Creating project directories..."
mkdir -p "/home/jon/projects/aether/.gauntlet/"{logs,metrics,context,cache}
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "/home/jon/projects/aether"

# 10. Reload systemd and enable services
echo "Reloading systemd..."
systemctl daemon-reload
systemctl enable aether.slice
systemctl enable aether-dev.service

# 11. Restart services
echo "Restarting services..."
systemctl restart aether-dev.service || true

echo "Migration completed successfully."
echo "Please verify the following:"
echo "1. Service is running: systemctl status aether-dev.service"
echo "2. Project directory exists: ls -la /home/jon/projects/aether"
echo "3. All configurations are updated: ls -la /etc/systemd/system/aether*" 