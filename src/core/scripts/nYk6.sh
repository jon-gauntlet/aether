#!/bin/bash

# Gauntlet Optimizer Script
# Handles system optimization for sustained development sessions

set -euo pipefail

# Create required directories
mkdir -p "${HOME}/.gauntlet"/{contexts,metrics,cache,state}

# Monitor system resources
while true; do
    # Collect system metrics
    top -b -n 1 > "${HOME}/.gauntlet/metrics/top_$(date +%Y%m%d_%H%M%S).log"
    free -m > "${HOME}/.gauntlet/metrics/memory_$(date +%Y%m%d_%H%M%S).log"
    
    # System load
    cat /proc/loadavg > "${HOME}/.gauntlet/metrics/loadavg_$(date +%Y%m%d_%H%M%S).log"
    
    # Memory info
    cat /proc/meminfo > "${HOME}/.gauntlet/metrics/meminfo_$(date +%Y%m%d_%H%M%S).log"
    
    # Process info for development tools
    ps aux | grep -E 'cursor|code|zsh' > "${HOME}/.gauntlet/metrics/dev_processes_$(date +%Y%m%d_%H%M%S).log"
    
    # Clean old metrics (keep last 24 hours)
    find "${HOME}/.gauntlet/metrics" -type f -mtime +1 -delete
    
    sleep 60
done 