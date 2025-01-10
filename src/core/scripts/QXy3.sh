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

# Set up the continuous optimization service
cat > /etc/systemd/system/gauntlet-optimizer.service << EOF
[Unit]
Description=Gauntlet Continuous Optimization Service
After=network.target
Wants=system-ai.slice

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
Environment="GAUNTLET_HOME=$GAUNTLET_HOME"
Environment="CURSOR_WORKSPACE=$USER_HOME/workspace"
Environment="CURSOR_LOG_LEVEL=error"
WorkingDirectory=$GAUNTLET_HOME
ExecStartPre=/bin/mkdir -p $GAUNTLET_HOME/state $GAUNTLET_HOME/logs $GAUNTLET_HOME/metrics $GAUNTLET_HOME/context/projects $GAUNTLET_HOME/context/cursor $GAUNTLET_HOME/context/system
ExecStart=/bin/bash -c '\
    while true; do \
        # 1. System State Collection \
        date > "$GAUNTLET_HOME/state/last_check" || true; \
        free -h > "$GAUNTLET_HOME/state/memory_status" || true; \
        uptime > "$GAUNTLET_HOME/state/load_status" || true; \
        df -h > "$GAUNTLET_HOME/state/disk_status" || true; \
        ps aux --sort=-%cpu | head -n 10 > "$GAUNTLET_HOME/state/top_processes" || true; \
        \
        # 2. Project Context Preservation \
        find "$CURSOR_WORKSPACE" -type f -name "*.md" -mtime -1 -exec cp {} "$GAUNTLET_HOME/context/projects/" \; 2>/dev/null || true; \
        find "$HOME/.cursor" -type f -name "*.log" -mtime -1 -exec cp {} "$GAUNTLET_HOME/context/cursor/" \; 2>/dev/null || true; \
        journalctl -n 1000 --no-pager > "$GAUNTLET_HOME/context/system/journal.log" 2>/dev/null || true; \
        \
        # 3. Performance Metrics Collection \
        vmstat 1 5 > "$GAUNTLET_HOME/metrics/vmstat.log" 2>/dev/null || true; \
        iostat -x 1 5 > "$GAUNTLET_HOME/metrics/iostat.log" 2>/dev/null || true; \
        \
        # 4. Optimization Application \
        PENDING_DIR="$GAUNTLET_HOME/optimizations/pending"; \
        if [ -d "$PENDING_DIR" ] && [ "$(ls -A "$PENDING_DIR" 2>/dev/null)" ]; then \
            while IFS= read -r -d "" opt; do \
                if [ -x "$opt" ]; then \
                    "$opt" && mv "$opt" "$GAUNTLET_HOME/optimizations/applied/" || true; \
                fi \
            done < <(find "$PENDING_DIR" -type f -print0) \
        fi; \
        \
        # 5. System Tuning \
        echo 1 | sudo tee /proc/sys/vm/swappiness >/dev/null 2>&1 || true; \
        echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null 2>&1 || true; \
        \
        # 6. Context Integration \
        find "$GAUNTLET_HOME/context" -type f -mtime -1 -exec cat {} + > "$GAUNTLET_HOME/state/current_context" 2>/dev/null || true; \
        \
        sleep 300; \
    done'
Restart=always
RestartSec=10
Nice=-10
CPUWeight=100
IOWeight=100
MemoryHigh=2G

[Install]
WantedBy=default.target
EOF

# Set up the metrics collector service
cat > /etc/systemd/system/gauntlet-metrics.service << EOF
[Unit]
Description=Gauntlet Metrics Collection Service
After=network.target

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
Environment="GAUNTLET_HOME=$GAUNTLET_HOME"
Environment="CURSOR_WORKSPACE=$USER_HOME/workspace"
WorkingDirectory=$GAUNTLET_HOME
ExecStartPre=/bin/mkdir -p $GAUNTLET_HOME/metrics
ExecStart=/bin/bash -c '\
    while true; do \
        # Collect system metrics \
        date +"%s" > "$GAUNTLET_HOME/metrics/timestamp" 2>/dev/null || true; \
        cat /proc/loadavg > "$GAUNTLET_HOME/metrics/loadavg" 2>/dev/null || true; \
        cat /proc/meminfo > "$GAUNTLET_HOME/metrics/meminfo" 2>/dev/null || true; \
        cat /proc/stat > "$GAUNTLET_HOME/metrics/cpu_stats" 2>/dev/null || true; \
        \
        # Collect Cursor metrics \
        find "$HOME/.cursor" -type f -name "*.log" -exec tail -n 100 {} + > "$GAUNTLET_HOME/metrics/cursor_logs" 2>/dev/null || true; \
        \
        # Collect project metrics \
        find "$CURSOR_WORKSPACE" -type f -mmin -60 > "$GAUNTLET_HOME/metrics/active_files" 2>/dev/null || true; \
        \
        sleep 60; \
    done'
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

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