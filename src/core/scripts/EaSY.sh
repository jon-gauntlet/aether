#!/bin/bash

# Continuous Optimization System Setup
# This script sets up services for continuous system optimization

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})
GAUNTLET_HOME="$USER_HOME/.gauntlet"
CURSOR_WORKSPACE="$USER_HOME/workspace"

echo "Setting up continuous optimization system..."

# Create Gauntlet home directory structure
mkdir -p "$GAUNTLET_HOME"/{state,logs,metrics,context/{projects,cursor,system},optimizations/{pending,applied}}
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$GAUNTLET_HOME"

# Create workspace directory if it doesn't exist
mkdir -p "$CURSOR_WORKSPACE"
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$CURSOR_WORKSPACE"

# Create environment files
cat > /etc/gauntlet/optimizer.env << EOF
GAUNTLET_HOME=$GAUNTLET_HOME
CURSOR_WORKSPACE=$CURSOR_WORKSPACE
HOME=$USER_HOME
EOF

cat > /etc/gauntlet/metrics.env << EOF
GAUNTLET_HOME=$GAUNTLET_HOME
CURSOR_WORKSPACE=$CURSOR_WORKSPACE
HOME=$USER_HOME
EOF

# Create the optimizer script
cat > /usr/local/bin/gauntlet-optimizer << 'EOF'
#!/bin/bash
source /etc/gauntlet/optimizer.env

while true; do
    # 1. System State Collection
    date > "${GAUNTLET_HOME}/state/last_check" || true
    free -h > "${GAUNTLET_HOME}/state/memory_status" || true
    uptime > "${GAUNTLET_HOME}/state/load_status" || true
    df -h > "${GAUNTLET_HOME}/state/disk_status" || true
    ps aux --sort=-%cpu | head -n 10 > "${GAUNTLET_HOME}/state/top_processes" || true

    # 2. Project Context Preservation
    find "${CURSOR_WORKSPACE}" -type f -name "*.md" -mtime -1 -exec cp {} "${GAUNTLET_HOME}/context/projects/" \; 2>/dev/null || true
    find "${HOME}/.cursor" -type f -name "*.log" -mtime -1 -exec cp {} "${GAUNTLET_HOME}/context/cursor/" \; 2>/dev/null || true
    journalctl -n 1000 --no-pager > "${GAUNTLET_HOME}/context/system/journal.log" 2>/dev/null || true

    # 3. Performance Metrics Collection
    vmstat 1 5 > "${GAUNTLET_HOME}/metrics/vmstat.log" 2>/dev/null || true
    iostat -x 1 5 > "${GAUNTLET_HOME}/metrics/iostat.log" 2>/dev/null || true

    # 4. Optimization Application
    PENDING_DIR="${GAUNTLET_HOME}/optimizations/pending"
    if [ -d "${PENDING_DIR}" ] && [ "$(ls -A "${PENDING_DIR}" 2>/dev/null)" ]; then
        while IFS= read -r -d "" opt; do
            if [ -x "${opt}" ]; then
                "${opt}" && mv "${opt}" "${GAUNTLET_HOME}/optimizations/applied/" || true
            fi
        done < <(find "${PENDING_DIR}" -type f -print0)
    fi

    # 5. System Tuning
    echo 1 | sudo tee /proc/sys/vm/swappiness >/dev/null 2>&1 || true
    echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null 2>&1 || true

    # 6. Context Integration
    find "${GAUNTLET_HOME}/context" -type f -mtime -1 -exec cat {} + > "${GAUNTLET_HOME}/state/current_context" 2>/dev/null || true

    sleep 300
done
EOF

chmod +x /usr/local/bin/gauntlet-optimizer

# Create the metrics script
cat > /usr/local/bin/gauntlet-metrics << 'EOF'
#!/bin/bash
source /etc/gauntlet/metrics.env

while true; do
    # Collect system metrics
    date +"%s" > "${GAUNTLET_HOME}/metrics/timestamp" 2>/dev/null || true
    cat /proc/loadavg > "${GAUNTLET_HOME}/metrics/loadavg" 2>/dev/null || true
    cat /proc/meminfo > "${GAUNTLET_HOME}/metrics/meminfo" 2>/dev/null || true
    cat /proc/stat > "${GAUNTLET_HOME}/metrics/cpu_stats" 2>/dev/null || true

    # Collect Cursor metrics
    find "${HOME}/.cursor" -type f -name "*.log" -exec tail -n 100 {} + > "${GAUNTLET_HOME}/metrics/cursor_logs" 2>/dev/null || true

    # Collect project metrics
    find "${CURSOR_WORKSPACE}" -type f -mmin -60 > "${GAUNTLET_HOME}/metrics/active_files" 2>/dev/null || true

    sleep 60
done
EOF

chmod +x /usr/local/bin/gauntlet-metrics

# Set up the metrics collector service
cat > /etc/systemd/system/gauntlet-metrics.service << 'EOF'
[Unit]
Description=Gauntlet Metrics Collection Service
After=network.target

[Service]
Type=simple
User=GAUNTLET_USER
Group=GAUNTLET_USER
Environment="GAUNTLET_HOME=GAUNTLET_HOME_PATH"
Environment="CURSOR_WORKSPACE=CURSOR_WORKSPACE_PATH"
Environment="HOME=USER_HOME_PATH"
WorkingDirectory=GAUNTLET_HOME_PATH
ExecStartPre=/bin/mkdir -p GAUNTLET_HOME_PATH/metrics
ExecStart=/usr/local/bin/gauntlet-metrics
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

# Replace placeholders in the service file
sed -i "s|GAUNTLET_USER|$ORIGINAL_USER|g" /etc/systemd/system/gauntlet-metrics.service
sed -i "s|GAUNTLET_HOME_PATH|$GAUNTLET_HOME|g" /etc/systemd/system/gauntlet-metrics.service
sed -i "s|CURSOR_WORKSPACE_PATH|$CURSOR_WORKSPACE|g" /etc/systemd/system/gauntlet-metrics.service
sed -i "s|USER_HOME_PATH|$USER_HOME|g" /etc/systemd/system/gauntlet-metrics.service

# Set up the continuous optimization service
cat > /etc/systemd/system/gauntlet-optimizer.service << 'EOF'
[Unit]
Description=Gauntlet Continuous Optimization Service
After=network.target
Wants=system-ai.slice

[Service]
Type=simple
User=GAUNTLET_USER
Group=GAUNTLET_USER
Environment="GAUNTLET_HOME=GAUNTLET_HOME_PATH"
Environment="CURSOR_WORKSPACE=CURSOR_WORKSPACE_PATH"
Environment="HOME=USER_HOME_PATH"
Environment="CURSOR_LOG_LEVEL=error"
WorkingDirectory=GAUNTLET_HOME_PATH
ExecStartPre=/bin/mkdir -p GAUNTLET_HOME_PATH/state GAUNTLET_HOME_PATH/logs GAUNTLET_HOME_PATH/metrics GAUNTLET_HOME_PATH/context/projects GAUNTLET_HOME_PATH/context/cursor GAUNTLET_HOME_PATH/context/system
ExecStart=/usr/local/bin/gauntlet-optimizer
Restart=always
RestartSec=10
Nice=-10
CPUWeight=100
IOWeight=100
MemoryHigh=2G

[Install]
WantedBy=default.target
EOF

# Replace placeholders in the service file
sed -i "s|GAUNTLET_USER|$ORIGINAL_USER|g" /etc/systemd/system/gauntlet-optimizer.service
sed -i "s|GAUNTLET_HOME_PATH|$GAUNTLET_HOME|g" /etc/systemd/system/gauntlet-optimizer.service
sed -i "s|CURSOR_WORKSPACE_PATH|$CURSOR_WORKSPACE|g" /etc/systemd/system/gauntlet-optimizer.service
sed -i "s|USER_HOME_PATH|$USER_HOME|g" /etc/systemd/system/gauntlet-optimizer.service

# Add sudoers configuration
cat > /etc/sudoers.d/99-gauntlet << EOF
# Allow Gauntlet services to perform system tuning
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/tee /proc/sys/vm/swappiness
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
EOF

chmod 440 /etc/sudoers.d/99-gauntlet

# Enable and start services
systemctl daemon-reload
systemctl enable --now gauntlet-optimizer.service
systemctl enable --now gauntlet-metrics.service

echo "Continuous optimization system installed successfully."
echo "The system will now:"
echo "1. Continuously monitor and optimize system performance"
echo "2. Preserve and integrate context across sessions"
echo "3. Collect and analyze metrics for improvements"
echo "4. Auto-generate and apply optimizations"
echo "5. Maintain optimal state for ADHD workflow" 