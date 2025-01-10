#!/bin/bash

# Gauntlet AI System Optimization Script
# Following Arch Linux best practices for system optimization and Python management

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

# Install essential development tools from official repos
echo "🛠️ Installing development tools..."
sudo pacman -S --needed --noconfirm \
    base-devel git cmake \
    python python-pip python-virtualenv python-pipx \
    python-numpy python-pandas python-scipy python-scikit-learn \
    python-pytorch python-pytorch-cuda \
    jupyter jupyter-notebook jupyterlab \
    python-matplotlib python-seaborn \
    python-black python-pylint python-pytest \
    docker docker-compose \
    htop btop iotop \
    tmux neovim \
    ripgrep fd bat \
    linux-headers dkms

# Install yay AUR helper if not present
if ! command -v yay &> /dev/null; then
    echo "📦 Installing yay AUR helper..."
    git clone https://aur.archlinux.org/yay.git /tmp/yay
    (cd /tmp/yay && makepkg -si --noconfirm)
    rm -rf /tmp/yay
fi

# Install AUR packages
echo "📦 Installing AUR packages..."
yay -S --needed --noconfirm \
    python-accelerate \
    python-bitsandbytes-cuda \
    python-transformers \
    python-datasets

# Setup workspace
echo "📁 Creating workspace structure..."
mkdir -p ~/workspace/gauntlet/{experiments,models,data,notebooks,scripts}
cd ~/workspace/gauntlet

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
python -m venv .venv
source .venv/bin/activate

# Install additional packages in virtual environment
echo "📦 Installing Python packages..."
pip install --upgrade pip
pip install \
    flash-attn==2.5.0 \
    optimum==1.16.1 \
    peft==0.8.2 \
    safetensors==0.4.2 \
    sentencepiece==0.2.0 \
    tokenizers==0.15.2 \
    tqdm==4.66.2 \
    wandb==0.16.3

# System optimization following Arch guidelines
echo "⚡ Optimizing system performance..."

# CPU Governor optimization (only if cpupower is installed)
if command -v cpupower &> /dev/null; then
    echo "⚡ Setting CPU governor..."
    sudo cpupower frequency-set -g performance
fi

# Create performance tuning file
echo "⚡ Configuring system parameters..."
sudo tee /etc/sysctl.d/99-gauntlet.conf << EOF
# VM optimizations (conservative values following Arch guidelines)
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

# Setup Docker following Arch guidelines
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

# System maintenance
alias update='yay -Syu'
alias cleanup='yay -Yc && sudo paccache -r'
EOF

# Setup git configuration
echo "🔧 Configuring Git..."
git config --global core.editor "nvim"
git config --global pull.rebase true
git config --global init.defaultBranch main

echo "✅ System optimization complete!"
echo "Please log out and log back in for all changes to take effect."
echo "Remember to run 'source ~/.zshrc' to load the new aliases." 