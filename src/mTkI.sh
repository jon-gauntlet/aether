#!/bin/bash

# Diagnostic script to gather system information for Gauntlet AI optimization
# Creates a detailed report of system capabilities and current configuration

echo "🔍 Gathering system information..."

OUTPUT_FILE="$HOME/gauntlet_system_info.txt"

{
    echo "=== System Information Report ==="
    echo "Generated on: $(date)"
    echo
    
    echo "=== CPU Information ==="
    echo "CPU Model:"
    lscpu | grep "Model name"
    echo "CPU Cores and Threads:"
    lscpu | grep -E "^CPU\(s\):|^Thread|^Core|^Socket|^NUMA|^Cache"
    echo "Current CPU Governor:"
    cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | uniq
    echo
    
    echo "=== Memory Information ==="
    echo "RAM Usage:"
    free -h
    echo "Swap Configuration:"
    swapon --show
    echo "Current VM Settings:"
    sysctl -a | grep -E "vm.swappiness|vm.dirty_|vm.vfs_cache_pressure"
    echo
    
    echo "=== GPU Information ==="
    echo "Graphics Cards:"
    lspci | grep -i "vga\|3d\|2d"
    if command -v nvidia-smi &> /dev/null; then
        echo "NVIDIA Details:"
        nvidia-smi
    fi
    echo
    
    echo "=== Storage Information ==="
    echo "Disk Layout:"
    lsblk -f
    echo "Disk Usage:"
    df -h
    echo "I/O Schedulers:"
    for disk in /sys/block/sd*/queue/scheduler; do
        echo "$disk: $(cat $disk)"
    done
    echo
    
    echo "=== Network Information ==="
    echo "Network Interfaces:"
    ip -br addr
    echo "Network Settings:"
    sysctl -a | grep -E "net.core|net.ipv4.tcp"
    echo
    
    echo "=== Python Environment ==="
    echo "System Python Version:"
    python --version
    echo "Installed Python Versions:"
    ls /usr/bin/python* | grep -E "python[0-9]"
    echo "pip Packages (System):"
    pip list
    echo
    
    echo "=== Package Information ==="
    echo "Pacman Package Count:"
    pacman -Q | wc -l
    echo "AUR Packages:"
    pacman -Qm
    echo "Development Tools:"
    pacman -Qs "^base-devel$\|^gcc$\|^cmake$\|^git$"
    echo
    
    echo "=== System Limits ==="
    echo "File Limits:"
    ulimit -a
    echo "System Limits:"
    cat /proc/sys/fs/file-max
    cat /proc/sys/fs/inotify/max_user_watches
    echo
    
    echo "=== Docker Status ==="
    if command -v docker &> /dev/null; then
        echo "Docker Version:"
        docker --version
        echo "Docker Status:"
        systemctl status docker
        echo "Docker Info:"
        docker info
    else
        echo "Docker not installed"
    fi
    echo
    
    echo "=== Current Resource Usage ==="
    echo "Top Processes by CPU:"
    ps aux --sort=-%cpu | head -n 5
    echo "Top Processes by Memory:"
    ps aux --sort=-%mem | head -n 5
    echo
    
    echo "=== System Optimization Status ==="
    echo "CPU Frequency Scaling:"
    cpupower frequency-info 2>/dev/null || echo "cpupower not installed"
    echo "Current I/O Scheduler:"
    cat /sys/block/$(lsblk -d | grep -v loop | grep -v sr | head -n1 | cut -d' ' -f1)/queue/scheduler
    echo "NUMA Status:"
    numactl --hardware 2>/dev/null || echo "numactl not installed"
    
} | tee "$OUTPUT_FILE"

echo "✅ System information gathered and saved to: $OUTPUT_FILE"
echo "Please share the contents of this file to help optimize your system for Gauntlet AI." 