#!/bin/bash

# Persistence Setup for Gauntlet Optimizations
# This script ensures all optimizations persist across system reboots

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

echo "Setting up optimization persistence..."

# Create systemd path for early boot optimization
mkdir -p /etc/systemd/system/system-ai.slice.d
cat > /etc/systemd/system/system-ai.slice.d/override.conf << EOF
[Slice]
CPUWeight=100
IOWeight=100
MemoryHigh=16G
TasksMax=infinity
EOF

# Create early boot service
cat > /etc/systemd/system/gauntlet-early-boot.service << EOF
[Unit]
Description=Gauntlet Early Boot Optimization
DefaultDependencies=no
Before=basic.target
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c '\
echo 1 > /proc/sys/vm/swappiness; \
echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; \
echo 20000 > /proc/sys/kernel/sched_latency_ns; \
echo 10000 > /proc/sys/kernel/sched_min_granularity_ns; \
echo 1000000 > /proc/sys/kernel/sched_wakeup_granularity_ns; \
echo 2 > /proc/sys/kernel/perf_event_paranoid; \
echo 0 > /proc/sys/kernel/kptr_restrict; \
echo 100000 > /proc/sys/kernel/sched_migration_cost_ns; \
echo 1000000 > /proc/sys/vm/stat_interval; \
echo 3 > /proc/sys/vm/drop_caches; \
echo 1 > /proc/sys/vm/compact_memory; \
echo 0 > /proc/sys/kernel/nmi_watchdog; \
echo 1 > /proc/sys/kernel/sched_autogroup_enabled; \
echo 1000 > /proc/sys/vm/vfs_cache_pressure; \
echo 100 > /proc/sys/vm/dirty_ratio; \
echo 50 > /proc/sys/vm/dirty_background_ratio; \
echo 12000 > /proc/sys/vm/dirty_expire_centisecs; \
echo 1500 > /proc/sys/vm/dirty_writeback_centisecs'
RemainAfterExit=yes

[Install]
WantedBy=basic.target
EOF

# Create persistent sysctl configuration
cat > /etc/sysctl.d/99-gauntlet.conf << EOF
# VM optimizations
vm.swappiness = 1
vm.vfs_cache_pressure = 1000
vm.dirty_ratio = 100
vm.dirty_background_ratio = 50
vm.dirty_expire_centisecs = 12000
vm.dirty_writeback_centisecs = 1500
vm.stat_interval = 1000000

# Kernel optimizations
kernel.sched_latency_ns = 20000
kernel.sched_min_granularity_ns = 10000
kernel.sched_wakeup_granularity_ns = 1000000
kernel.sched_migration_cost_ns = 100000
kernel.perf_event_paranoid = 2
kernel.kptr_restrict = 0
kernel.nmi_watchdog = 0
kernel.sched_autogroup_enabled = 1

# File system optimizations
fs.inotify.max_user_watches = 524288
fs.file-max = 2097152
fs.nr_open = 2097152
EOF

# Create persistent udev rules for CPU optimization
cat > /etc/udev/rules.d/99-gauntlet-cpu.rules << EOF
# Set CPU governor to performance on hotplug
SUBSYSTEM=="cpu", ACTION=="add", ATTR{cpufreq/scaling_governor}="performance"
EOF

# Create persistent modprobe configuration
cat > /etc/modprobe.d/99-gauntlet.conf << EOF
# Optimize for low latency
options iwlwifi power_save=0
options iwlmvm power_scheme=1
options snd_hda_intel power_save=0
options snd_ac97_codec power_save=0
EOF

# Create systemd-sleep hook for post-resume optimization
mkdir -p /usr/lib/systemd/system-sleep
cat > /usr/lib/systemd/system-sleep/gauntlet-resume << 'EOF'
#!/bin/bash

case $1 in
    post)
        echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
        echo 1 > /proc/sys/vm/swappiness
        echo 1000 > /proc/sys/vm/vfs_cache_pressure
        systemctl restart gauntlet-optimizer.service
        systemctl restart gauntlet-metrics.service
        systemctl restart chatgenius-dev.service
        ;;
esac
EOF

chmod +x /usr/lib/systemd/system-sleep/gauntlet-resume

# Update system limits
cat > /etc/security/limits.d/99-gauntlet.conf << EOF
# Increase resource limits for development
$ORIGINAL_USER soft nofile 524288
$ORIGINAL_USER hard nofile 524288
$ORIGINAL_USER soft nproc unlimited
$ORIGINAL_USER hard nproc unlimited
$ORIGINAL_USER soft memlock unlimited
$ORIGINAL_USER hard memlock unlimited
$ORIGINAL_USER soft stack unlimited
$ORIGINAL_USER hard stack unlimited
EOF

# Create persistent tmpfiles configuration
cat > /etc/tmpfiles.d/gauntlet.conf << EOF
# Preserve Gauntlet directories across reboots
d $USER_HOME/.gauntlet 0755 $ORIGINAL_USER $ORIGINAL_USER -
d $USER_HOME/.gauntlet/state 0755 $ORIGINAL_USER $ORIGINAL_USER -
d $USER_HOME/.gauntlet/logs 0755 $ORIGINAL_USER $ORIGINAL_USER -
d $USER_HOME/.gauntlet/metrics 0755 $ORIGINAL_USER $ORIGINAL_USER -
d $USER_HOME/.gauntlet/context 0755 $ORIGINAL_USER $ORIGINAL_USER -
d $USER_HOME/.gauntlet/optimizations 0755 $ORIGINAL_USER $ORIGINAL_USER -
EOF

# Enable early boot service
systemctl daemon-reload
systemctl enable gauntlet-early-boot.service

# Apply sysctl settings
sysctl -p /etc/sysctl.d/99-gauntlet.conf

# Move this script to applied directory
mv "$0" "$(dirname "$0")/../applied/"

echo "Persistence system installed successfully."
echo "The following optimizations will persist across reboots:"
echo "1. Early boot system optimization"
echo "2. CPU governor and scheduler settings"
echo "3. Memory and I/O optimizations"
echo "4. Resource limits and system configurations"
echo "5. Post-resume optimization hooks" 