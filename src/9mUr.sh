#!/bin/bash

# Gauntlet AI System Optimization Script
# This script optimizes the system for AI development workloads

# Error handling
set -euo pipefail

echo "🚀 Starting Gauntlet AI system optimization..."

# Optimize pacman mirrors
echo "🔄 Optimizing package mirrors..."
sudo pacman -S --noconfirm reflector
sudo reflector --latest 20 --protocol https --sort rate --save /etc/pacman.d/mirrorlist

# System update
echo "📦 Updating system packages..."
sudo pacman -Syu --noconfirm

# Install essential development tools
echo "🛠️ Installing development tools..."
sudo pacman -S --needed --noconfirm \
    base-devel git cmake \
    python311 python-pip python-virtualenv python-pipx \
    docker docker-compose \
    htop btop iotop \
    tmux neovim \
    ripgrep fd bat \
    linux-headers dkms

# Python ML/AI environment setup
echo "🐍 Setting up Python virtual environment..."
mkdir -p ~/workspace/gauntlet
cd ~/workspace/gauntlet

# Create and activate virtual environment with Python 3.11
python3.11 -m venv .venv
source .venv/bin/activate

# Install Python packages in virtual environment
pip install --upgrade pip
pip install \
    numpy==1.26.4 \
    pandas==2.2.0 \
    scipy==1.12.0 \
    scikit-learn==1.4.0 \
    torch==2.2.0 \
    torchvision==0.17.0 \
    transformers==4.37.2 \
    datasets==2.17.0 \
    jupyter==1.0.0 \
    jupyterlab==4.1.0 \
    matplotlib==3.8.3 \
    seaborn==0.13.2 \
    black==24.1.1 \
    isort==5.13.2 \
    mypy==1.8.0 \
    pylint==3.0.3 \
    pytest==8.0.0 \
    hypothesis==6.98.0

# Install global tools using pipx
echo "🔧 Installing global Python tools..."
pipx install black
pipx install isort
pipx install mypy
pipx install pylint

# System optimization
echo "⚡ Optimizing system performance..."

# CPU Governor optimization
echo "performance" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Create performance tuning file
sudo tee /etc/sysctl.d/99-gauntlet.conf << EOF
# VM optimizations
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10

# Network optimizations
net.core.somaxconn=1024
net.core.netdev_max_backlog=5000
net.ipv4.tcp_max_syn_backlog=8096
net.ipv4.tcp_slow_start_after_idle=0
net.ipv4.tcp_tw_reuse=1

# File system optimizations
fs.file-max=2097152
fs.inotify.max_user_watches=524288
EOF

# Apply sysctl settings
sudo sysctl --system

# Setup Docker
echo "🐳 Configuring Docker..."
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Create RAM disk for temporary data
echo "💾 Setting up RAM disk for temporary data..."
sudo mkdir -p /mnt/ramdisk
echo "tmpfs /mnt/ramdisk tmpfs rw,size=8G,noexec,nosuid,nodev,noatime 0 0" | sudo tee -a /etc/fstab
sudo mount -a

# Setup development aliases
echo "⚙️ Setting up development aliases..."
cat >> ~/.zshrc << EOF

# Gauntlet AI Development Aliases
alias gauntlet='cd ~/workspace/gauntlet && source .venv/bin/activate'
alias jupyter='jupyter lab --no-browser'
alias train='python train.py'
alias test='python -m pytest'
alias gpu='watch -n 1 nvidia-smi'
alias cpu='btop'
alias dev='tmux new-session -A -s dev'

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

# Activate Gauntlet environment by default
if [[ -f ~/workspace/gauntlet/.venv/bin/activate ]]; then
    source ~/workspace/gauntlet/.venv/bin/activate
fi
EOF

# Create workspace structure
echo "📁 Creating workspace structure..."
mkdir -p ~/workspace/gauntlet/{experiments,models,data,notebooks,scripts}

# Setup git configuration
echo "🔧 Configuring Git..."
git config --global core.editor "nvim"
git config --global pull.rebase true
git config --global init.defaultBranch main

echo "✅ System optimization complete!"
echo "Please log out and log back in for all changes to take effect."
echo "Remember to run 'source ~/.zshrc' to load the new aliases."
echo "Your Gauntlet environment will be activated automatically in new shells." 