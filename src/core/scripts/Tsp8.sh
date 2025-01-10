#!/bin/bash

# Optimization Consolidation Script
# Run with: sudo ./03_consolidate_optimizations.sh

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

echo "Consolidating system optimizations..."

# 1. Clean up duplicate/old services
systemctl stop cursor-updater.service ai-first-optimizer.service 2>/dev/null || true
systemctl disable cursor-updater.service ai-first-optimizer.service 2>/dev/null || true
rm -f /etc/systemd/system/cursor-updater.service \
      /etc/systemd/system/ai-first-optimizer.service \
      /etc/systemd/system/cursor-priority.service 2>/dev/null || true

# 2. Update system-ai.slice for better ADHD workflow
cat > /etc/systemd/system/system-ai.slice << EOF
[Unit]
Description=AI System Slice
Before=slices.target
DefaultDependencies=no
Requires=-.slice
After=-.slice
AssertPathExists=$USER_HOME/workspace

[Slice]
CPUAccounting=yes
IOAccounting=yes
MemoryAccounting=yes
TasksAccounting=yes
CPUWeight=100
IOWeight=100
MemoryHigh=infinity
MemoryMax=infinity
TasksMax=infinity
CPUQuota=100%
AllowedCPUs=0-7
MemoryLow=4G
Delegate=memory pids cpu io
IPAccounting=yes
IPAddressAllow=any
DevicePolicy=auto
DeviceAllow=/dev/kvm rwm
DeviceAllow=/dev/dri rwm
DeviceAllow=/dev/nvidia* rwm
DeviceAllow=/dev/fuse rwm
EOF

# 3. Update ai-system-cleanup.service for better maintenance
cat > /etc/systemd/system/ai-system-cleanup.service << EOF
[Unit]
Description=AI System Maintenance and Cleanup Service
After=network.target
Wants=cursor-agent.service cursor-index.service

[Service]
Type=oneshot
User=root
Environment="CURSOR_WORKSPACE=$USER_HOME/workspace"
Environment="CURSOR_LOG_LEVEL=error"
ExecStart=/bin/bash -c '\
    # System cleanup \
    journalctl --vacuum-time=2d; \
    find /var/log/cursor -type f -mtime +7 -delete; \
    find /tmp -type f -atime +1 -delete; \
    paccache -rk1; \
    pacman -Sc --noconfirm; \
    rm -f /var/lib/pacman/db.lck; \
    \
    # Package updates \
    pacman -Syu --noconfirm || true; \
    \
    # Cursor optimization \
    systemctl restart cursor-agent.service || true; \
    systemctl restart cursor-index.service || true; \
    \
    # Resource optimization \
    echo 1 > /proc/sys/vm/swappiness; \
    echo performance > /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; \
    echo 0 > /sys/devices/system/cpu/intel_pstate/no_turbo; \
    \
    # ADHD optimizations \
    echo 20000 > /proc/sys/kernel/sched_latency_ns; \
    echo 10000 > /proc/sys/kernel/sched_min_granularity_ns; \
    echo 3000000 > /proc/sys/kernel/sched_wakeup_granularity_ns; \
    echo 0 > /proc/sys/kernel/sched_migration_cost_ns; \
    \
    # Cache cleanup \
    rm -rf $USER_HOME/.cache/yay/* || true; \
    rm -rf $USER_HOME/.cache/pip/* || true; \
    find $USER_HOME/.cache -type f -atime +7 -delete || true; \
    \
    # Index refresh \
    sudo -u $ORIGINAL_USER $USER_HOME/scripts/index_codebase.sh || true; \
    \
    # System sync \
    sync; \
    systemctl restart system-ai.slice'
Nice=19
IOSchedulingClass=idle
CPUSchedulingPolicy=idle
MemoryLimit=2G
Slice=system-ai.slice
TimeoutStartSec=1h
Restart=on-failure
RestartSec=1min

[Install]
WantedBy=multi-user.target
EOF

# 4. Update timer for more frequent maintenance during work hours
cat > /etc/systemd/system/ai-system-cleanup.timer << EOF
[Unit]
Description=AI System Maintenance Timer
Requires=ai-system-cleanup.service

[Timer]
OnBootSec=1min
OnCalendar=*:0/15
RandomizedDelaySec=30
AccuracySec=1s
Persistent=true
WakeSystem=true

[Install]
WantedBy=timers.target
EOF

# 5. Set up sysctl configurations for ADHD-optimized workflow
cat > /etc/sysctl.d/99-adhd-optimizations.conf << EOF
# Reduce context switching latency
kernel.sched_latency_ns = 20000
kernel.sched_min_granularity_ns = 10000
kernel.sched_wakeup_granularity_ns = 3000000
kernel.sched_migration_cost_ns = 0

# Improve I/O performance
vm.dirty_ratio = 10
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50
vm.swappiness = 1

# Improve network responsiveness
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_low_latency = 1
net.core.default_qdisc = fq
EOF

# 6. Reload configurations
sysctl --system
systemctl daemon-reload
systemctl restart system-ai.slice
systemctl enable --now ai-system-cleanup.timer

# 7. Move this script to applied directory
mv "$0" "$(dirname "$0")/../applied/"

echo "System optimizations consolidated successfully."
echo "The system is now optimized for ADHD workflow with:"
echo "- Reduced context switching latency"
echo "- Improved I/O responsiveness"
echo "- Better resource management"
echo "- More frequent maintenance during work hours" 