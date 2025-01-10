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
    python python-pip python-pipx \
    python-virtualenv python-poetry \
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
    python-pylint python-mypy \
    python-jupyter-notebook \
    python-ipykernel python-ipywidgets \
    thermald

# Setup workspace
echo "📁 Creating workspace structure..."
sudo -u $ORIGINAL_USER mkdir -p $USER_HOME/workspace/gauntlet/{experiments,models,data,notebooks,scripts,logs}
cd $USER_HOME/workspace/gauntlet

# Install global development tools with pipx
echo "🔧 Installing development tools with pipx..."
sudo -u $ORIGINAL_USER bash -c '
    pipx install poetry
    pipx install black
    pipx install isort
    pipx install pylint
    pipx install mypy
    pipx install jupyterlab
'

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
if [ -d "$USER_HOME/workspace/gauntlet/.venv" ]; then
    sudo -u $ORIGINAL_USER rm -rf "$USER_HOME/workspace/gauntlet/.venv"
fi

# Create pyproject.toml for dependency management
echo "📝 Creating Python project configuration..."
sudo -u $ORIGINAL_USER bash -c "cat > $USER_HOME/workspace/gauntlet/pyproject.toml" << EOF
[tool.poetry]
name = "gauntlet-ai"
version = "0.1.0"
description = "Gauntlet AI Development Environment"
authors = ["$ORIGINAL_USER"]

[tool.poetry.dependencies]
python = "^3.11"
torch = {version = "^2.1.2", source = "pytorch"}
transformers = "^4.37.2"
datasets = "^2.17.0"
accelerate = "^0.26.1"
bitsandbytes = "^0.42.0"
optimum = "^1.16.1"
peft = "^0.8.2"
safetensors = "^0.4.2"
sentencepiece = "^0.2.0"
wandb = "^0.16.3"
deepspeed = "^0.13.1"
einops = "^0.7.0"
evaluate = "^0.4.1"

[tool.poetry.group.dev.dependencies]
black = "^24.1.1"
isort = "^5.13.2"
pylint = "^3.0.3"
mypy = "^1.8.0"
pytest = "^8.0.0"
ipykernel = "^6.29.0"

[[tool.poetry.source]]
name = "pytorch"
url = "https://download.pytorch.org/whl/cpu"
priority = "explicit"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"
multi_line_output = 3

[tool.pylint]
max-line-length = 88
disable = ["C0111", "C0103"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
EOF

# Initialize poetry environment
echo "🎯 Initializing poetry environment..."
sudo -u $ORIGINAL_USER bash -c "cd $USER_HOME/workspace/gauntlet && poetry install"

# Setup development aliases
echo "⚙️ Setting up development aliases..."
sudo -u $ORIGINAL_USER bash -c "cat >> $USER_HOME/.zshrc" << 'EOF'

# Gauntlet AI Development Aliases
alias gauntlet='cd ~/workspace/gauntlet && poetry shell'
alias jupyter='poetry run jupyter lab --no-browser'
alias train='poetry run python train.py'
alias test='poetry run pytest'
alias gpu='nvtop'
alias cpu='btop'
alias dev='tmux new-session -A -s dev'
alias temp='sensors | grep "Core"'

# Quick access to RAM disk
alias fast='cd /mnt/ramdisk'

# Development tools
alias format='poetry run black . && poetry run isort .'
alias lint='poetry run pylint'
alias types='poetry run mypy'

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