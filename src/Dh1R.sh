#!/bin/bash

# AI-First Development System Optimizer
# Continuous optimization for AI Engineering workloads

set -euo pipefail

# Logging setup
readonly LOG_DIR="/var/log/ai-first"
readonly LOG_FILE="$LOG_DIR/optimizer.log"
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check root privileges
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# System optimization functions
optimize_memory() {
    log "Optimizing memory management..."
    
    # Configure aggressive memory management
    cat > /etc/sysctl.d/99-ai-memory.conf << EOF
vm.swappiness=1
vm.vfs_cache_pressure=50
vm.page-cluster=0
vm.dirty_background_ratio=5
vm.dirty_ratio=10
vm.dirty_writeback_centisecs=1500
vm.dirty_expire_centisecs=3000
vm.min_free_kbytes=1048576
vm.zone_reclaim_mode=0
vm.watermark_boost_factor=0
vm.watermark_scale_factor=125
vm.stat_interval=10
vm.mmap_min_addr=65536
EOF
    sysctl --system || true
}

optimize_cpu() {
    log "Optimizing CPU settings..."
    
    # Set CPU governor to performance
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        echo "performance" > "$cpu" 2>/dev/null || true
    done
    
    # Disable CPU throttling
    echo "0" > /sys/devices/system/cpu/intel_pstate/no_turbo 2>/dev/null || true
    
    # Configure CPU scheduler for AI workloads
    cat > /etc/sysctl.d/99-ai-cpu.conf << EOF
kernel.sched_autogroup_enabled=0
kernel.sched_latency_ns=1000000
kernel.sched_min_granularity_ns=100000
kernel.sched_migration_cost_ns=5000000
kernel.sched_rt_runtime_us=-1
kernel.sched_tunable_scaling=0
EOF
    sysctl --system || true
}

optimize_io() {
    log "Optimizing I/O settings..."
    
    # Configure I/O scheduler
    for device in /sys/block/*/queue/scheduler; do
        echo "none" > "$device" 2>/dev/null || true
    done
    
    # Optimize I/O settings
    for device in /sys/block/*/queue/; do
        echo "0" > "${device}add_random" 2>/dev/null || true
        echo "256" > "${device}nr_requests" 2>/dev/null || true
        echo "4096" > "${device}read_ahead_kb" 2>/dev/null || true
    done
}

optimize_network() {
    log "Optimizing network settings..."
    
    cat > /etc/sysctl.d/99-ai-network.conf << EOF
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.ipv4.tcp_rmem=4096 87380 16777216
net.ipv4.tcp_wmem=4096 65536 16777216
net.core.netdev_max_backlog=16384
net.ipv4.tcp_max_syn_backlog=8192
net.ipv4.tcp_slow_start_after_idle=0
net.ipv4.tcp_tw_reuse=1
EOF
    sysctl --system || true
}

optimize_filesystem() {
    log "Optimizing filesystem settings..."
    
    # Increase file limits
    cat > /etc/security/limits.d/99-ai-fs.conf << EOF
*               soft    nofile          1048576
*               hard    nofile          1048576
*               soft    nproc           unlimited
*               hard    nproc           unlimited
*               soft    memlock         unlimited
*               hard    memlock         unlimited
*               soft    stack           unlimited
*               hard    stack           unlimited
EOF

    # Configure inotify for large codebases
    cat > /etc/sysctl.d/99-ai-fs.conf << EOF
fs.inotify.max_user_watches=524288
fs.inotify.max_user_instances=512
fs.file-max=2097152
fs.pipe-max-size=4194304
EOF
    sysctl --system || true
}

setup_ramdisk() {
    log "Setting up AI development ramdisk..."
    
    mkdir -p /mnt/ai-ramdisk
    if ! grep -q "/mnt/ai-ramdisk" /etc/fstab; then
        echo "tmpfs /mnt/ai-ramdisk tmpfs rw,size=8G,noexec,nosuid,nodev,noatime 0 0" >> /etc/fstab
    fi
    mount -a || true
}

optimize_packages() {
    log "Optimizing package management..."
    
    # Configure pacman for parallel downloads
    sed -i 's/#ParallelDownloads = 5/ParallelDownloads = 10/' /etc/pacman.conf
    
    # Add AI repository if not present
    if ! grep -q "\[ai\]" /etc/pacman.conf; then
        cat >> /etc/pacman.conf << EOF

[ai]
Server = https://ai.archlinux.org/\$arch
EOF
    fi
    
    # Update system
    pacman -Sy --noconfirm archlinux-keyring
    pacman -Syu --noconfirm
    
    # Clean package cache but keep one version
    paccache -rk1
}

optimize_services() {
    log "Optimizing system services..."
    
    # Disable unnecessary services
    SERVICES_TO_DISABLE=(
        "bluetooth.service"
        "cups.service"
        "avahi-daemon.service"
        "ModemManager.service"
    )
    
    for service in "${SERVICES_TO_DISABLE[@]}"; do
        systemctl disable "$service" 2>/dev/null || true
        systemctl stop "$service" 2>/dev/null || true
    done
    
    # Enable essential services
    SERVICES_TO_ENABLE=(
        "fstrim.timer"
        "thermald.service"
        "irqbalance.service"
    )
    
    for service in "${SERVICES_TO_ENABLE[@]}"; do
        systemctl enable "$service" 2>/dev/null || true
        systemctl start "$service" 2>/dev/null || true
    done
}

main() {
    log "Starting AI-First Development system optimization..."
    
    optimize_memory
    optimize_cpu
    optimize_io
    optimize_network
    optimize_filesystem
    setup_ramdisk
    optimize_packages
    optimize_services
    
    log "System optimization complete"
}

# Run main function
main 