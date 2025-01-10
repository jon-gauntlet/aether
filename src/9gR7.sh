#!/bin/bash

# Gauntlet AI System Diagnostic Script
# Gathers system information for optimization

# Error handling
set -euo pipefail
trap 'echo "Error on line $LINENO. Exit code: $?"' ERR

OUTPUT_FILE=~/gauntlet_system_info.txt

echo "🔍 Gathering system information..."

{
    echo "=== System Information Report ==="
    date
    echo

    echo "=== CPU Information ==="
    lscpu | grep -E "Model name|Thread|CPU\(s\)|Cache"
    echo

    echo "=== Memory Information ==="
    free -h
    echo
    cat /proc/sys/vm/swappiness
    echo

    echo "=== Storage Information ==="
    df -h
    echo
    lsblk
    echo

    echo "=== Python Versions ==="
    command -v python3.11 && python3.11 --version || echo "Python 3.11 not found"
    command -v python3.13 && python3.13 --version || echo "Python 3.13 not found"
    echo

    echo "=== Package Information ==="
    pacman -Q | grep -E "python|cuda|torch|nvidia|tensorflow" || echo "No matching packages found"
    echo

    echo "=== Service Status ==="
    systemctl status thermald --no-pager || echo "thermald not found"
    echo
    systemctl status auto-cpufreq --no-pager || echo "auto-cpufreq not found"
    echo
    systemctl status docker --no-pager || echo "docker not found"
    echo

    echo "=== Resource Usage ==="
    top -b -n 1 | head -n 20
    echo

    echo "=== Network Configuration ==="
    ip a
    echo

    echo "=== Environment Variables ==="
    env | grep -E "PYTHON|CUDA|PATH|LD_LIBRARY"
    echo

    echo "=== Workspace Status ==="
    if [ -d ~/workspace/gauntlet ]; then
        ls -la ~/workspace/gauntlet
        if [ -d ~/workspace/gauntlet/.venv ]; then
            echo "Virtual environment exists"
            source ~/workspace/gauntlet/.venv/bin/activate 2>/dev/null && pip list || echo "Failed to activate venv"
        else
            echo "No virtual environment found"
        fi
    else
        echo "Gauntlet workspace not found"
    fi

} | tee "$OUTPUT_FILE"

echo "✅ System information gathered and saved to $OUTPUT_FILE" 