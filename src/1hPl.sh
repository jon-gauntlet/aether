#!/bin/bash
# Aether Project Optimization
# This script optimizes the environment specifically for Aether development

# Ensure we're running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

# Store original user for later
ORIGINAL_USER="$SUDO_USER"
USER_HOME="/home/$ORIGINAL_USER"
AETHER_DIR="$USER_HOME/projects/aether"

echo "Setting up Aether optimization..."

# Create slice configuration
cat > /etc/systemd/system/aether.slice << EOF
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

# Create service configuration
cat > /etc/systemd/system/aether-dev.service << EOF
[Unit]
Description=Aether Development Environment
After=network.target gauntlet-optimizer.service gauntlet-metrics.service
Wants=gauntlet-optimizer.service gauntlet-metrics.service
ConditionPathExists=/etc/gauntlet/aether.env
ConditionPathExists=/usr/local/bin/aether-monitor

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
Environment="CURSOR_PROJECT=$AETHER_DIR"
EnvironmentFile=/etc/gauntlet/aether.env
WorkingDirectory=$AETHER_DIR
ExecStartPre=/bin/mkdir -p $AETHER_DIR/.gauntlet/logs
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

# Create project directories
mkdir -p "$AETHER_DIR/.gauntlet/"{logs,metrics,context,cache}

# Create cursor rules
cat > "$AETHER_DIR/.cursorrules" << EOF
{
    "name": "Aether",
    "version": "1.0.0",
    "rules": {
        "max_concurrent_tasks": 8,
        "max_memory_percent": 80,
        "max_cpu_percent": 90,
        "priority_boost": true
    }
}
EOF

# Set up git hooks
mkdir -p "$AETHER_DIR/.git/hooks"
cat > "$AETHER_DIR/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit hook for Aether project
set -e

# Run tests
if [ -f "run_tests.sh" ]; then
    ./run_tests.sh
fi

# Check formatting
if [ -f "check_format.sh" ]; then
    ./check_format.sh
fi
EOF

chmod +x "$AETHER_DIR/.git/hooks/pre-commit"

# Set permissions
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$AETHER_DIR/.gauntlet"
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$AETHER_DIR/.git/hooks"
chown "$ORIGINAL_USER:$ORIGINAL_USER" "$AETHER_DIR/.cursorrules"

# Enable services
systemctl daemon-reload
systemctl enable --now aether.slice
systemctl enable --now aether-dev.service

# Done
echo "Aether optimization system installed successfully." 