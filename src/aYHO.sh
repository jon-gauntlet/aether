#!/bin/bash

# Create Claude instances optimization
sudo tee /etc/systemd/system/claude-instances.slice > /dev/null << 'EOF'
[Slice]
Description=Resource allocation for multiple Claude instances
CPUWeight=90
IOWeight=90
MemoryHigh=12G
MemoryMax=16G
CPUQuota=80%
TasksMax=256
AllowedCPUs=0-7
MemorySwapMax=0
Delegate=yes
EOF

# Create individual instance services
sudo tee /etc/systemd/system/claude-root.service > /dev/null << 'EOF'
[Unit]
Description=Claude Instance - Root Directory
After=network.target
Requires=claude-instances.slice

[Service]
Type=simple
ExecStart=/usr/bin/env CURSOR_WORKSPACE=/ DISPLAY=:0 /usr/bin/cursor
Slice=claude-instances.slice
Environment=CURSOR_WORKSPACE=/
Environment=DISPLAY=:0
Environment=ELECTRON_ENABLE_LOGGING=1
CPUWeight=45
IOWeight=45
MemoryHigh=6G
MemoryMax=8G
Nice=-10

# ADHD Optimizations
CPUSchedulingPolicy=fifo
CPUSchedulingPriority=50
IOSchedulingClass=realtime
IOSchedulingPriority=0

# Security and Permissions
NoNewPrivileges=no
ProtectSystem=no
ProtectHome=no
PrivateTmp=yes
User=jon
Group=jon

# FUSE requirements
CapabilityBoundingSet=CAP_SYS_ADMIN
AmbientCapabilities=CAP_SYS_ADMIN
DeviceAllow=/dev/fuse
SystemCallFilter=@mount
MountFlags=shared

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/claude-aether.service > /dev/null << 'EOF'
[Unit]
Description=Claude Instance - Aether Project
After=network.target
Requires=claude-instances.slice

[Service]
Type=simple
ExecStart=/usr/bin/env CURSOR_WORKSPACE=/home/jon/projects/aether DISPLAY=:0 /usr/bin/cursor
Slice=claude-instances.slice
Environment=CURSOR_WORKSPACE=/home/jon/projects/aether
Environment=DISPLAY=:0
Environment=ELECTRON_ENABLE_LOGGING=1
CPUWeight=45
IOWeight=45
MemoryHigh=6G
MemoryMax=8G
Nice=-10

# ADHD Optimizations
CPUSchedulingPolicy=fifo
CPUSchedulingPriority=50
IOSchedulingClass=realtime
IOSchedulingPriority=0

# Security and Permissions
NoNewPrivileges=no
ProtectSystem=no
ProtectHome=no
PrivateTmp=yes
User=jon
Group=jon

# FUSE requirements
CapabilityBoundingSet=CAP_SYS_ADMIN
AmbientCapabilities=CAP_SYS_ADMIN
DeviceAllow=/dev/fuse
SystemCallFilter=@mount
MountFlags=shared

[Install]
WantedBy=multi-user.target
EOF

# System optimizations
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.d/99-claude-optimization.conf
echo "kernel.sched_autogroup_enabled=0" | sudo tee -a /etc/sysctl.d/99-claude-optimization.conf
echo "kernel.sched_latency_ns=6000000" | sudo tee -a /etc/sysctl.d/99-claude-optimization.conf
echo "kernel.sched_min_granularity_ns=100000" | sudo tee -a /etc/sysctl.d/99-claude-optimization.conf
echo "kernel.sched_wakeup_granularity_ns=500000" | sudo tee -a /etc/sysctl.d/99-claude-optimization.conf

# Apply changes
sudo systemctl daemon-reload
sudo sysctl --system
sudo systemctl enable claude-instances.slice
sudo systemctl enable claude-root.service
sudo systemctl enable claude-aether.service
sudo systemctl start claude-instances.slice
sudo systemctl start claude-root.service
sudo systemctl start claude-aether.service

# Set CPU governor to performance for active sessions
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Optimize memory management
echo 3 | sudo tee /proc/sys/vm/drop_caches
echo 1 | sudo tee /proc/sys/vm/compact_memory 