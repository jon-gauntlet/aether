#!/bin/bash

# Cursor and Composer Agent Priority Configuration Script
# This script must be run with sudo

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Configure system limits
cat > /etc/security/limits.d/cursor.conf << EOF
*               soft    nofile          1048576
*               hard    nofile          1048576
*               soft    nproc           unlimited
*               hard    nproc           unlimited
*               soft    memlock         unlimited
*               hard    memlock         unlimited
*               soft    stack           unlimited
*               hard    stack           unlimited
EOF

# Set CPU governor to performance
for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
    echo "performance" > "$cpu" 2>/dev/null || true
done

# Disable CPU throttling
echo "0" > /sys/devices/system/cpu/intel_pstate/no_turbo 2>/dev/null || true

# Configure I/O scheduler for better performance
for device in /sys/block/*/queue/scheduler; do
    echo "none" > "$device" 2>/dev/null || true
done

# Set swappiness to minimum
echo "1" > /proc/sys/vm/swappiness

# Configure sysctl parameters
cat > /etc/sysctl.d/99-cursor.conf << EOF
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512
vm.max_map_count = 262144
kernel.sched_rt_runtime_us = -1
kernel.sched_rt_period_us = 1000000
EOF

# Apply sysctl changes
sysctl --system

# Set process priorities for Cursor
for proc in $(pgrep -f "cursor"); do
    renice -n -20 -p "$proc" 2>/dev/null || true
    ionice -c 1 -n 0 -p "$proc" 2>/dev/null || true
done

# Create a systemd override for Cursor processes
mkdir -p /etc/systemd/system/user-.slice.d/
cat > /etc/systemd/system/user-.slice.d/99-cursor.conf << EOF
[Slice]
CPUWeight=100
IOWeight=100
MemoryHigh=16G
EOF

# Reload systemd configuration
systemctl daemon-reload

echo "Cursor and Composer Agent priority configuration complete" 