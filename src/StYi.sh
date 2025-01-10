#!/bin/bash

# Gauntlet AI System Optimization Script
# Optimized for Intel i7-1355U with 16GB RAM on EndeavourOS

# Check if script is run with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo $0"
    exit 1
fi

# Store the original user for non-root operations
ORIGINAL_USER=$(logname)
USER_HOME=$(eval echo ~$ORIGINAL_USER)

# Error handling
set -euo pipefail
trap 'echo "Error on line $LINENO. Exit code: $?"' ERR

echo "🚀 Starting Gauntlet AI system optimization..."

# System update and repository optimization
echo "📦 Optimizing package mirrors and updating system..."
pacman -Sy --noconfirm archlinux-keyring
pacman -S --needed --noconfirm reflector
reflector --latest 20 --protocol https --sort rate --save /etc/pacman.d/mirrorlist
pacman -Syu --noconfirm

# Install essential development tools from official repos
echo "🛠️ Installing development tools..."
pacman -S --needed --noconfirm \
    base-devel git cmake \
    python python-pip python-virtualenv \
    docker docker-compose \
    htop btop iotop \
    tmux neovim \
    ripgrep fd bat \
    linux-headers dkms \
    cpupower lm_sensors \
    xclip \
    python-pytorch python-torchvision python-torchaudio \
    python-transformers python-datasets \
    python-scikit-learn python-pandas python-numpy \
    python-matplotlib python-seaborn \
    python-black python-pytest python-isort \
    jupyter-notebook \
    thermald

# Setup workspace
echo "📁 Creating workspace structure..."
sudo -u $ORIGINAL_USER mkdir -p $USER_HOME/workspace/gauntlet/{experiments,models,data,notebooks,scripts,logs}
cd $USER_HOME/workspace/gauntlet

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
if [ -d "$USER_HOME/workspace/gauntlet/.venv" ]; then
    sudo -u $ORIGINAL_USER rm -rf "$USER_HOME/workspace/gauntlet/.venv"
fi

sudo -u $ORIGINAL_USER python -m venv "$USER_HOME/workspace/gauntlet/.venv"

# Install additional Python packages that aren't available in repos
sudo -u $ORIGINAL_USER bash -c "
    source $USER_HOME/workspace/gauntlet/.venv/bin/activate
    pip install --upgrade pip
    pip install \
        accelerate==0.26.1 \
        bitsandbytes==0.42.0 \
        optimum==1.16.1 \
        peft==0.8.2 \
        safetensors==0.4.2 \
        sentencepiece==0.2.0 \
        wandb==0.16.3 \
        deepspeed==0.13.1 \
        einops==0.7.0 \
        evaluate==0.4.1
"

# System optimization for i7-1355U
echo "⚡ Optimizing system performance..."

# Stop and disable conflicting services
echo "🔄 Managing services..."
systemctl stop power-profiles-daemon.service 2>/dev/null || true
systemctl disable power-profiles-daemon.service 2>/dev/null || true

# Enable and start thermal management
systemctl enable --now thermald

# CPU optimization
echo "⚡ Configuring CPU settings..."
cpupower frequency-set -g performance

# Create performance tuning file
echo "⚡ Configuring system parameters..."
cat > /etc/sysctl.d/99-gauntlet.conf << EOF
# VM optimizations for ML workloads
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10
vm.dirty_expire_centisecs=3000
vm.dirty_writeback_centisecs=500
vm.page-cluster=0
vm.min_free_kbytes=1048576

# Network optimizations
net.core.somaxconn=1024
net.core.netdev_max_backlog=5000
net.ipv4.tcp_max_syn_backlog=8096
net.ipv4.tcp_slow_start_after_idle=0
net.ipv4.tcp_tw_reuse=1
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.ipv4.tcp_rmem=4096 87380 16777216
net.ipv4.tcp_wmem=4096 65536 16777216

# File system optimizations
fs.file-max=2097152
fs.inotify.max_user_watches=524288
EOF

# Apply sysctl settings
sysctl --system

# Configure NVMe optimization if NVMe drive exists
if [ -d "/sys/class/nvme" ]; then
    echo "⚡ Optimizing NVMe storage..."
    cat > /etc/udev/rules.d/71-nvme-io.rules << EOF
ACTION=="add|change", KERNEL=="nvme[0-9]*", ATTR{queue/scheduler}="none"
ACTION=="add|change", KERNEL=="nvme[0-9]*", ATTR{queue/read_ahead_kb}="2048"
ACTION=="add|change", KERNEL=="nvme[0-9]*", ATTR{queue/nr_requests}="2048"
EOF
fi

# Setup Docker
echo "🐳 Configuring Docker..."
systemctl enable --now docker
usermod -aG docker $ORIGINAL_USER

# Create RAM disk for temporary data (8GB)
echo "💾 Setting up RAM disk for temporary data..."
mkdir -p /mnt/ramdisk
if ! grep -q "/mnt/ramdisk" /etc/fstab; then
    echo "tmpfs /mnt/ramdisk tmpfs rw,size=8G,noexec,nosuid,nodev,noatime 0 0" >> /etc/fstab
fi
mount -a

# Setup development aliases
echo "⚙️ Setting up development aliases..."
sudo -u $ORIGINAL_USER bash -c "cat >> $USER_HOME/.zshrc" << 'EOF'

# Gauntlet AI Development Aliases
alias gauntlet='cd ~/workspace/gauntlet && source .venv/bin/activate'
alias jupyter='jupyter lab --no-browser'
alias train='python train.py'
alias test='python -m pytest'
alias gpu='nvtop'
alias cpu='btop'
alias dev='tmux new-session -A -s dev'
alias temp='sensors | grep "Core"'

# Quick access to RAM disk
alias fast='cd /mnt/ramdisk'

# Development tools
alias format='black . && isort .'
alias lint='pylint'
alias types='mypy'

# Git shortcuts
alias gs='git status'
alias gd='git diff'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'

# System maintenance
alias update='sudo pacman -Syu'
alias cleanup='sudo pacman -Sc && sudo paccache -r'
alias optimize='sudo cpupower frequency-set -g performance'

# Clipboard support
alias pbcopy='xclip -selection clipboard'
alias pbpaste='xclip -selection clipboard -o'
EOF

# Setup git configuration
echo "🔧 Configuring Git..."
sudo -u $ORIGINAL_USER git config --global core.editor "nvim"
sudo -u $ORIGINAL_USER git config --global pull.rebase true
sudo -u $ORIGINAL_USER git config --global init.defaultBranch main

# Create training environment file
echo "📝 Creating environment configuration..."
sudo -u $ORIGINAL_USER bash -c "cat > $USER_HOME/workspace/gauntlet/.env" << EOF
# Training Configuration
WANDB_PROJECT=gauntlet
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
TOKENIZERS_PARALLELISM=true
EOF

echo "✅ System optimization complete!"
echo "Please log out and log back in for all changes to take effect."
echo "Remember to run 'source ~/.zshrc' to load the new aliases."
echo "Your Gauntlet AI workspace is ready at ~/workspace/gauntlet" 