#!/bin/bash

# AI System Setup and Configuration Script
# Run with: sudo ./setup_ai_system.sh

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

# Ensure script directory exists
SCRIPT_DIR="$USER_HOME/scripts"
mkdir -p "$SCRIPT_DIR"

# Function to safely write system files
write_system_file() {
    local path="$1"
    local content="$2"
    local dir=$(dirname "$path")
    
    mkdir -p "$dir"
    echo "$content" > "$path"
    
    # Set appropriate permissions
    if [[ "$path" == "/etc/sudoers.d/"* ]]; then
        chmod 440 "$path"
    else
        chmod 644 "$path"
    fi
}

echo "Setting up AI system configuration..."

# 1. Create system-ai.slice
write_system_file "/etc/systemd/system/system-ai.slice" "[Unit]
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
DeviceAllow=/dev/fuse rwm"

# 2. Create ai-system-cleanup.service
write_system_file "/etc/systemd/system/ai-system-cleanup.service" "[Unit]
Description=AI System Maintenance and Cleanup Service
After=network.target
Wants=cursor-agent.service cursor-index.service

[Service]
Type=oneshot
User=root
Environment=\"CURSOR_WORKSPACE=$USER_HOME/workspace\"
Environment=\"CURSOR_LOG_LEVEL=error\"
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
    pacman -Sy --noconfirm archlinux-keyring && \
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
    # Cache cleanup \
    rm -rf $USER_HOME/.cache/yay/* || true; \
    rm -rf $USER_HOME/.cache/pip/* || true; \
    find $USER_HOME/.cache -type f -atime +7 -delete || true; \
    \
    # Index refresh \
    sudo -u $ORIGINAL_USER $SCRIPT_DIR/index_codebase.sh || true; \
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
WantedBy=multi-user.target"

# 3. Create ai-system-cleanup.timer
write_system_file "/etc/systemd/system/ai-system-cleanup.timer" "[Unit]
Description=AI System Maintenance Timer
Requires=ai-system-cleanup.service

[Timer]
OnBootSec=2min
OnCalendar=*:0/30
RandomizedDelaySec=300
AccuracySec=1min
Persistent=true
WakeSystem=true

[Install]
WantedBy=timers.target"

# 4. Set up sudoers configuration for Cursor
write_system_file "/etc/sudoers.d/99-cursor-agent" "# Allow Cursor Agent to execute specific commands without password
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/pacman
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/journalctl
$ORIGINAL_USER ALL=(ALL) NOPASSWD: $SCRIPT_DIR/index_codebase.sh
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /bin/mount
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /bin/umount
$ORIGINAL_USER ALL=(ALL) NOPASSWD: /usr/bin/fusermount"

# 5. Reload systemd and enable services
systemctl daemon-reload
systemctl enable --now system-ai.slice
systemctl enable --now ai-system-cleanup.timer

# 6. Set ownership of script directory
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$SCRIPT_DIR"

# Add user to required groups
usermod -aG fuse $ORIGINAL_USER

echo "AI system configuration complete. No more sudo prompts should appear in the UI." 