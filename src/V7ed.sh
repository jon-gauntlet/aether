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

# Create cgroup configuration for Cursor
mkdir -p /sys/fs/cgroup/cursor
echo "+cpu.weight.nice 100" > /sys/fs/cgroup/cursor/cgroup.subtree_control
echo "+memory.high 16G" >> /sys/fs/cgroup/cursor/cgroup.subtree_control

# Set process priorities
for proc in $(pgrep -f "cursor"); do
    renice -n -20 -p "$proc" 2>/dev/null || true
    ionice -c 1 -n 0 -p "$proc" 2>/dev/null || true
done

# Configure system limits for the user
cat > /etc/security/limits.d/cursor.conf << EOF
${SUDO_USER:-$USER}    soft    nofile          1048576
${SUDO_USER:-$USER}    hard    nofile          1048576
${SUDO_USER:-$USER}    soft    nproc           unlimited
${SUDO_USER:-$USER}    hard    nproc           unlimited
${SUDO_USER:-$USER}    soft    memlock         unlimited
${SUDO_USER:-$USER}    hard    memlock         unlimited
${SUDO_USER:-$USER}    soft    stack           unlimited
${SUDO_USER:-$USER}    hard    stack           unlimited
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

# Increase inotify limits
echo "fs.inotify.max_user_watches = 524288" > /etc/sysctl.d/99-cursor.conf
echo "fs.inotify.max_user_instances = 512" >> /etc/sysctl.d/99-cursor.conf

# Apply sysctl changes
sysctl --system

echo "Cursor and Composer Agent priority configuration complete" 