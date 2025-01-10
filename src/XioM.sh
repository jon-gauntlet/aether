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

# Create systemd slice for Cursor
cat > /etc/systemd/system/cursor.slice << EOF
[Slice]
CPUWeight=100
IOWeight=100
MemoryHigh=16G
EOF

# Set process priorities
for proc in $(pgrep -f "cursor"); do
    renice -n -20 -p "$proc" 2>/dev/null || true
    ionice -c 1 -n 0 -p "$proc" 2>/dev/null || true
    systemd-run --slice=cursor.slice -p "Nice=-20" --scope -p "CPUSchedulingPolicy=rr" -p "CPUSchedulingPriority=99" --no-ask-password -p "Delegate=yes" -p "CPUQuota=100%" --uid=$(id -u ${SUDO_USER:-$USER}) --gid=$(id -g ${SUDO_USER:-$USER}) true
done

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
cat > /etc/sysctl.d/99-cursor.conf << EOF
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512
vm.max_map_count = 262144
kernel.sched_rt_runtime_us = -1
kernel.sched_rt_period_us = 1000000
EOF

# Apply sysctl changes
sysctl --system

# Set up udev rule for better I/O priority
cat > /etc/udev/rules.d/99-cursor.rules << EOF
SUBSYSTEM=="cpu", ACTION=="add", ATTR{cpufreq/scaling_governor}="performance"
EOF

# Reload udev rules
udevadm control --reload-rules
udevadm trigger

echo "Cursor and Composer Agent priority configuration complete" 