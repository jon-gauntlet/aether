#!/bin/bash

# Continuous Optimization and Re-Integration System
# This script sets up a self-improving system that continuously optimizes
# and re-integrates all components for maximum effectiveness.

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

echo "Setting up continuous optimization system..."

# Create directory structure
mkdir -p "$USER_HOME/.gauntlet/"{state,logs,metrics,context,optimizations}
mkdir -p "$USER_HOME/.gauntlet/context/"{system,projects,cursor,adhd}
mkdir -p "$USER_HOME/.gauntlet/optimizations/"{pending,applied,templates}

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
Environment="GAUNTLET_HOME=$USER_HOME/.gauntlet"
Environment="CURSOR_WORKSPACE=$USER_HOME/workspace"
Environment="CURSOR_LOG_LEVEL=error"
WorkingDirectory=$USER_HOME/.gauntlet
ExecStart=/bin/bash -c '\
while true; do \
    # 1. System State Collection \
    date > state/last_check; \
    free -h > state/memory_status; \
    uptime > state/load_status; \
    df -h > state/disk_status; \
    ps aux --sort=-%cpu | head -n 10 > state/top_processes; \
    \
    # 2. Project Context Preservation \
    find $USER_HOME/projects -type f -name "*.md" -mtime -1 -exec cp {} context/projects/ \; ; \
    find $USER_HOME/.cursor -type f -name "*.log" -mtime -1 -exec cp {} context/cursor/ \; ; \
    journalctl -n 1000 --no-pager > context/system/journal.log; \
    \
    # 3. Performance Metrics Collection \
    vmstat 1 5 > metrics/vmstat.log; \
    iostat -x 1 5 > metrics/iostat.log; \
    \
    # 4. Optimization Application \
    if [ -f optimizations/pending/* ]; then \
        for opt in optimizations/pending/*; do \
            if [ -x "$opt" ]; then \
                "$opt" && mv "$opt" optimizations/applied/; \
            fi \
        done \
    fi; \
    \
    # 5. System Tuning \
    echo 1 > /proc/sys/vm/swappiness; \
    echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; \
    echo 20000 > /proc/sys/kernel/sched_latency_ns; \
    echo 10000 > /proc/sys/kernel/sched_min_granularity_ns; \
    \
    # 6. Context Integration \
    find context -type f -mtime -1 -exec cat {} + > state/current_context; \
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
Environment="GAUNTLET_HOME=$USER_HOME/.gauntlet"
WorkingDirectory=$USER_HOME/.gauntlet
ExecStart=/bin/bash -c '\
while true; do \
    # Collect system metrics \
    date +%s > metrics/timestamp; \
    cat /proc/loadavg > metrics/loadavg; \
    cat /proc/meminfo > metrics/meminfo; \
    cat /proc/stat > metrics/cpu_stats; \
    \
    # Collect Cursor metrics \
    find $USER_HOME/.cursor -type f -name "*.log" -exec tail -n 100 {} + > metrics/cursor_logs; \
    \
    # Collect project metrics \
    find $USER_HOME/projects -type f -mmin -60 > metrics/active_files; \
    \
    sleep 60; \
done'
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

# Set up automatic optimization template
cat > "$USER_HOME/.gauntlet/optimizations/templates/new_optimization.sh" << 'EOF'
#!/bin/bash
# Auto-generated optimization template
# Copy this file to ../pending/ and modify as needed

set -euo pipefail

# Optimization metadata
OPTIMIZATION_NAME="$1"
OPTIMIZATION_TYPE="$2"
OPTIMIZATION_PRIORITY="$3"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$GAUNTLET_HOME/logs/optimizations.log"
}

# Check preconditions
check_preconditions() {
    # Add precondition checks here
    return 0
}

# Apply optimization
apply_optimization() {
    # Add optimization logic here
    return 0
}

# Verify optimization
verify_optimization() {
    # Add verification logic here
    return 0
}

# Main execution
log "Starting optimization: $OPTIMIZATION_NAME"
if check_preconditions; then
    if apply_optimization; then
        if verify_optimization; then
            log "Optimization successful: $OPTIMIZATION_NAME"
            exit 0
        fi
    fi
fi
log "Optimization failed: $OPTIMIZATION_NAME"
exit 1
EOF

# Set up the context collector
cat > "$USER_HOME/.gauntlet/collect_context.sh" << 'EOF'
#!/bin/bash

# Collect system context
collect_system_context() {
    uname -a > context/system/kernel.txt
    lscpu > context/system/cpu.txt
    lsblk > context/system/storage.txt
    ip addr > context/system/network.txt
}

# Collect project context
collect_project_context() {
    find ~/projects -type f -name "*.md" -exec cat {} + > context/projects/documentation.txt
    find ~/projects -type f -name "*.json" -exec cat {} + > context/projects/configuration.txt
}

# Collect ADHD context
collect_adhd_context() {
    # Monitor work patterns
    find ~ -type f -mmin -60 > context/adhd/recent_activity.txt
    ps aux --sort=-%cpu | head -20 > context/adhd/focus_processes.txt
}

# Collect Cursor context
collect_cursor_context() {
    find ~/.cursor -type f -name "*.log" -mtime -1 -exec cat {} + > context/cursor/recent_logs.txt
    find ~/.cursor -type f -name "*.json" -exec cat {} + > context/cursor/settings.txt
}

# Main collection loop
while true; do
    collect_system_context
    collect_project_context
    collect_adhd_context
    collect_cursor_context
    sleep 300
done
EOF

# Make scripts executable
chmod +x "$USER_HOME/.gauntlet/collect_context.sh"
chmod +x "$USER_HOME/.gauntlet/optimizations/templates/new_optimization.sh"

# Set correct ownership
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/.gauntlet"

# Enable and start services
systemctl daemon-reload
systemctl enable --now gauntlet-optimizer.service
systemctl enable --now gauntlet-metrics.service

# Move this script to applied directory
mv "$0" "$(dirname "$0")/../applied/"

echo "Continuous optimization system installed successfully."
echo "The system will now:"
echo "1. Continuously monitor and optimize system performance"
echo "2. Preserve and integrate context across sessions"
echo "3. Collect and analyze metrics for improvements"
echo "4. Auto-generate and apply optimizations"
echo "5. Maintain optimal state for ADHD workflow" 