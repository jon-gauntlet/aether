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
CONFIG_ROOT="/home/jon/workspace/system-ops/configs"

echo "Starting migration from chatgenius to aether..."

# 1. Update and install service files
echo "Updating service files..."
if [ -f "$CONFIG_ROOT/etc/systemd/system/chatgenius-dev.service" ]; then
    cat > "/etc/systemd/system/aether-dev.service" << 'EOF'
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
    # Also update our workspace copy
    cp "/etc/systemd/system/aether-dev.service" "$CONFIG_ROOT/etc/systemd/system/aether-dev.service"
    rm -f "$CONFIG_ROOT/etc/systemd/system/chatgenius-dev.service"
    rm -f "/etc/systemd/system/chatgenius-dev.service"
fi

# 2. Update and install environment file
echo "Updating environment file..."
mkdir -p /etc/gauntlet
cat > "/etc/gauntlet/aether.env" << EOF
CURSOR_PROJECT=/home/jon/projects/aether
GAUNTLET_HOME=/home/jon/projects/aether/.gauntlet
HOME=/home/jon
EOF
# Update workspace copy
mkdir -p "$CONFIG_ROOT/etc/gauntlet"
cp "/etc/gauntlet/aether.env" "$CONFIG_ROOT/etc/gauntlet/aether.env"
rm -f "$CONFIG_ROOT/etc/gauntlet/chatgenius.env"
rm -f "/etc/gauntlet/chatgenius.env"

# 3. Update and install slice configuration
echo "Updating slice configuration..."
cat > "/etc/systemd/system/aether.slice" << EOF
[Unit]
Description=Aether Project Slice
Before=slices.target
After=system-ai.slice

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=8G
TasksMax=infinity
EOF
# Update workspace copy
cp "/etc/systemd/system/aether.slice" "$CONFIG_ROOT/etc/systemd/system/aether.slice"
rm -f "$CONFIG_ROOT/etc/systemd/system/chatgenius.slice"
rm -f "/etc/systemd/system/chatgenius.slice"

# 4. Update and install system sleep script
echo "Updating system sleep script..."
mkdir -p /usr/lib/systemd/system-sleep
cat > "/usr/lib/systemd/system-sleep/gauntlet-resume" << 'EOF'
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
chmod +x "/usr/lib/systemd/system-sleep/gauntlet-resume"
# Update workspace copy
mkdir -p "$CONFIG_ROOT/systemd/system-sleep"
cp "/usr/lib/systemd/system-sleep/gauntlet-resume" "$CONFIG_ROOT/systemd/system-sleep/gauntlet-resume"

# 5. Clean up old files
echo "Cleaning up old files..."
rm -f "/etc/systemd/system/default.target.wants/chatgenius-dev.service"
rm -f "$CONFIG_ROOT/etc/systemd/system/default.target.wants/chatgenius-dev.service"

# 6. Update file ownership
echo "Updating file permissions..."
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$CONFIG_ROOT"

# 7. Move actual project directory if it exists
if [ -d "/home/jon/projects/chatgenius" ]; then
    echo "Moving project directory..."
    mv "/home/jon/projects/chatgenius" "/home/jon/projects/aether"
    chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "/home/jon/projects/aether"
fi

# 8. Update monitor binary
echo "Updating monitor binary..."
if [ -f "/usr/local/bin/chatgenius-monitor" ]; then
    mv "/usr/local/bin/chatgenius-monitor" "/usr/local/bin/aether-monitor"
fi

# 9. Reload systemd and enable services
echo "Reloading systemd..."
systemctl daemon-reload
systemctl enable aether.slice
systemctl enable aether-dev.service

# 10. Restart services
echo "Restarting services..."
systemctl restart aether-dev.service || true

echo "Migration completed successfully."
echo "Please verify the following:"
echo "1. Service is running: systemctl status aether-dev.service"
echo "2. Project directory exists: ls -la /home/jon/projects/aether"
echo "3. All configurations are updated: ls -la /etc/systemd/system/aether*" 