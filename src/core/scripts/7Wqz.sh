#!/bin/bash

# Gauntlet Optimizer Script
# Handles system optimization for sustained development sessions

set -euo pipefail

# Create required directories
mkdir -p "${HOME}/.gauntlet"/{contexts,metrics,cache,state}

# System optimizations
if command -v cpupower &> /dev/null; then
    sudo cpupower frequency-set -g performance
fi

# Set swappiness to 1 for better performance
echo vm.swappiness=1 | sudo tee /etc/sysctl.d/99-gauntlet-swappiness.conf

# Optimize I/O scheduler for NVMe/SSD
for disk in /sys/block/*/queue/scheduler; do
    if [ -f "$disk" ]; then
        echo "mq-deadline" | sudo tee "$disk"
    fi
done

# Set process priorities
renice -n -10 -p $$
for pid in $(pgrep -f "cursor|code|zsh"); do
    renice -n -5 -p "$pid" 2>/dev/null || true
done

# Monitor system resources
while true; do
    # Collect system metrics
    top -b -n 1 > "${HOME}/.gauntlet/metrics/top_$(date +%Y%m%d_%H%M%S).log"
    free -m > "${HOME}/.gauntlet/metrics/memory_$(date +%Y%m%d_%H%M%S).log"
    
    # Clean old metrics (keep last 24 hours)
    find "${HOME}/.gauntlet/metrics" -type f -mtime +1 -delete
    
    sleep 60
done 