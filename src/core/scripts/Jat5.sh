#!/bin/bash

# Gauntlet AI System Optimization Script
# Optimized for Intel i7-1355U with 16GB RAM on EndeavourOS

# Ensure script runs with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo $0"
    exit 1
fi

# Store the original user for non-root operations
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})

# Error handling and logging
exec 1> >(tee -a "$USER_HOME/gauntlet_setup.log")
exec 2> >(tee -a "$USER_HOME/gauntlet_setup.log" >&2)
set -o pipefail

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    local line_no=$1
    local error_code=$2
    log "Error on line $line_no. Exit code: $error_code"
    return 0  # Continue execution
}
trap 'handle_error ${LINENO} $?' ERR

# Pre-flight system check and cleanup
preflight_check() {
    log "🔍 Running pre-flight system check..."
    
    # Ensure pacman is not locked
    rm -f /var/lib/pacman/db.lck
    
    # Clean package cache
    log "🧹 Cleaning package cache..."
    yes | pacman -Scc || true
    
    # Clean user caches
    log "🧹 Cleaning user caches..."
    sudo -u "$ORIGINAL_USER" rm -rf "$USER_HOME/.cache/pip" || true
    sudo -u "$ORIGINAL_USER" rm -rf "$USER_HOME/.cache/pypoetry" || true
    find "$USER_HOME" -type d -name ".ipynb_checkpoints" -exec rm -rf {} + 2>/dev/null || true
    
    # Clean system journal
    log "📝 Cleaning system logs..."
    journalctl --vacuum-size=500M || true
    
    # Create workspace directory
    log "📁 Creating workspace directory..."
    mkdir -p "$USER_HOME/workspace"
    chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/workspace"
    chmod -R u+rw "$USER_HOME/workspace"
    
    log "✅ Pre-flight check complete!"
}

# Function to install packages safely
safe_install() {
    local packages="$1"
    local max_retries=3
    local retry_count=0
    local success=false

    while [ $retry_count -lt $max_retries ] && [ "$success" = false ]; do
        if pacman -S --needed --noconfirm $packages; then
            success=true
        else
            retry_count=$((retry_count + 1))
            log "📦 Package installation failed, attempt $retry_count of $max_retries"
            sleep 5
            pacman -Syy
        fi
    done

    if [ "$success" = false ]; then
        log "⚠️ Failed to install some packages after $max_retries attempts"
        return 0  # Continue execution
    fi
}

# Main installation
main() {
    log "🚀 Starting Gauntlet AI system optimization..."

    # Run pre-flight check
    preflight_check

    # Update system
    log "📦 Updating system..."
    pacman-key --init
    pacman-key --populate archlinux
    pacman -Sy --noconfirm archlinux-keyring
    pacman -Syyu --noconfirm

    # Install core packages
    log "🛠️ Installing development tools..."
    safe_install "base-devel git cmake python python-pip python-pipx python-virtualenv python-poetry docker docker-compose htop btop iotop tmux neovim ripgrep fd bat linux-headers dkms cpupower lm_sensors xclip"

    # Install Python packages
    log "🐍 Installing Python packages..."
    safe_install "python-pytorch python-torchvision python-torchaudio python-transformers python-datasets python-scikit-learn python-pandas python-numpy python-matplotlib python-seaborn python-black python-pytest python-isort python-pylint python-mypy python-jupyter-notebook python-ipykernel python-ipywidgets thermald"

    # Setup workspace
    log "📁 Setting up workspace..."
    sudo -u "$ORIGINAL_USER" mkdir -p "$USER_HOME/workspace/gauntlet"/{experiments,models,data,notebooks,scripts,logs}

    # Install global tools with pipx
    log "🔧 Installing development tools with pipx..."
    sudo -u "$ORIGINAL_USER" bash -c "
        export PATH=\"\$PATH:\$HOME/.local/bin\"
        pipx install poetry
        pipx install black
        pipx install isort
        pipx install pylint
        pipx install mypy
        pipx install jupyterlab
    " || true

    # Create project configuration
    log "📝 Creating project configuration..."
    sudo -u "$ORIGINAL_USER" bash -c "cat > \"$USER_HOME/workspace/gauntlet/pyproject.toml\"" << EOF
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
    log "🎯 Initializing poetry environment..."
    cd "$USER_HOME/workspace/gauntlet"
    sudo -u "$ORIGINAL_USER" bash -c "cd \"$USER_HOME/workspace/gauntlet\" && poetry install --no-interaction" || true

    # System optimizations
    log "⚡ Optimizing system performance..."
    systemctl disable power-profiles-daemon.service 2>/dev/null || true
    systemctl enable --now thermald || true
    cpupower frequency-set -g performance || true

    # Configure system parameters
    log "⚡ Configuring system parameters..."
    cat > /etc/sysctl.d/99-gauntlet.conf << EOF
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10
vm.dirty_expire_centisecs=3000
vm.dirty_writeback_centisecs=500
vm.page-cluster=0
vm.min_free_kbytes=1048576
net.core.somaxconn=1024
net.core.netdev_max_backlog=5000
net.ipv4.tcp_max_syn_backlog=8096
net.ipv4.tcp_slow_start_after_idle=0
net.ipv4.tcp_tw_reuse=1
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.ipv4.tcp_rmem=4096 87380 16777216
net.ipv4.tcp_wmem=4096 65536 16777216
fs.file-max=2097152
fs.inotify.max_user_watches=524288
EOF
    sysctl --system || true

    # Setup RAM disk
    log "💾 Setting up RAM disk..."
    mkdir -p /mnt/ramdisk
    if ! grep -q "/mnt/ramdisk" /etc/fstab; then
        echo "tmpfs /mnt/ramdisk tmpfs rw,size=8G,noexec,nosuid,nodev,noatime 0 0" >> /etc/fstab
    fi
    mount -a || true

    # Configure Git
    log "🔧 Configuring Git..."
    sudo -u "$ORIGINAL_USER" git config --global core.editor "nvim"
    sudo -u "$ORIGINAL_USER" git config --global pull.rebase true
    sudo -u "$ORIGINAL_USER" git config --global init.defaultBranch main

    # Setup aliases
    log "⚙️ Setting up aliases..."
    sudo -u "$ORIGINAL_USER" bash -c "cat >> \"$USER_HOME/.zshrc\"" << 'EOF'

# Gauntlet AI Development Aliases
alias gauntlet='cd ~/workspace/gauntlet && poetry shell'
alias jupyter='poetry run jupyter lab --no-browser'
alias train='poetry run python train.py'
alias test='poetry run pytest'
alias gpu='nvtop'
alias cpu='btop'
alias dev='tmux new-session -A -s dev'
alias temp='sensors | grep "Core"'
alias fast='cd /mnt/ramdisk'
alias format='poetry run black . && poetry run isort .'
alias lint='poetry run pylint'
alias types='poetry run mypy'
alias gs='git status'
alias gd='git diff'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
alias update='sudo pacman -Syu'
alias cleanup='sudo pacman -Sc && sudo paccache -r'
alias optimize='sudo cpupower frequency-set -g performance'
alias pbcopy='xclip -selection clipboard'
alias pbpaste='xclip -selection clipboard -o'
alias health='~/workspace/gauntlet/scripts/health_check.sh'
alias maintain='~/workspace/gauntlet/scripts/daily_maintenance.sh'
alias clean='sudo paccache -rk1 && poetry cache clear --all pypi'
EOF

    # Create maintenance scripts
    log "📝 Creating maintenance scripts..."
    cat > "$USER_HOME/workspace/gauntlet/scripts/health_check.sh" << 'EOF'
#!/bin/bash
echo "=== System Health Check ==="
echo "Memory Usage:"
free -h
echo -e "\nCPU Usage:"
top -bn1 | head -n 20
echo -e "\nDisk Usage:"
df -h
echo -e "\nPython Environment:"
poetry env info
echo -e "\nActive Services:"
systemctl status docker thermald --no-pager
EOF
    chmod +x "$USER_HOME/workspace/gauntlet/scripts/health_check.sh"
    chown "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/workspace/gauntlet/scripts/health_check.sh"

    cat > "$USER_HOME/workspace/gauntlet/scripts/daily_maintenance.sh" << 'EOF'
#!/bin/bash
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".ipynb_checkpoints" -exec rm -rf {} + 2>/dev/null
poetry update
poetry run pytest || true
poetry run black . || true
poetry run isort . || true
EOF
    chmod +x "$USER_HOME/workspace/gauntlet/scripts/daily_maintenance.sh"
    chown "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/workspace/gauntlet/scripts/daily_maintenance.sh"

    log "✅ System optimization complete!"
    log "Please log out and log back in for all changes to take effect."
    log "Remember to run 'source ~/.zshrc' to load the new aliases."
    log "Your Gauntlet AI workspace is ready at ~/workspace/gauntlet"
    log
    log "🔍 Available maintenance commands:"
    log "  - health    : Run system health check"
    log "  - maintain  : Run daily maintenance"
    log "  - clean     : Clean system caches"
    log "  - gauntlet  : Activate Gauntlet environment"
}

# Run main function
main 2>&1 | tee -a "$USER_HOME/gauntlet_setup.log" 