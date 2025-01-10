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

    # Install core development packages
    log "🛠️ Installing core development tools..."
    safe_install "base-devel git cmake ninja meson ccache gdb valgrind perf linux-headers dkms"

    # Install system monitoring and optimization tools
    log "📊 Installing system tools..."
    safe_install "htop btop iotop powertop thermald cpupower lm_sensors nvtop xclip ripgrep fd bat"

    # Install Python development stack
    log "🐍 Installing Python development tools..."
    safe_install "python python-pip python-pipx python-virtualenv python-poetry python-pytest python-black python-pylint python-mypy python-jupyter-notebook python-ipykernel python-ipywidgets"

    # Install Python AI/ML packages from official repos
    log "🧠 Installing Python AI/ML packages..."
    safe_install "python-pytorch python-pytorch-opt-adam python-torchvision python-torchaudio python-transformers python-datasets python-scikit-learn python-pandas python-numpy python-matplotlib python-seaborn python-tensorboard python-h5py python-pillow python-tqdm"

    # Install Node.js development stack
    log "📦 Installing Node.js development tools..."
    safe_install "nodejs npm typescript ts-node eslint prettier"

    # Install container and virtualization tools
    log "🐋 Installing container tools..."
    safe_install "docker docker-compose podman buildah skopeo"

    # Install development environment
    log "📝 Installing development environment..."
    safe_install "neovim tmux zsh zsh-completions zsh-syntax-highlighting fzf"

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
        pipx install tensorboard
    " || true

    # Install global Node.js tools
    log "🔧 Installing Node.js tools..."
    sudo -u "$ORIGINAL_USER" bash -c "
        npm install -g npm@latest
        npm install -g yarn
        npm install -g typescript
        npm install -g ts-node
        npm install -g @tensorflow/tfjs-node
        npm install -g @tensorflow/tfjs-node-gpu
        npm install -g onnxjs
        npm install -g pyright
        npm install -g eslint
        npm install -g prettier
        npm install -g typescript-language-server
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
tensorboard = "^2.15.1"
pytorch-lightning = "^2.1.3"
ray = {extras = ["tune"], version = "^2.9.0"}
optuna = "^3.5.0"
mlflow = "^2.10.0"

[tool.poetry.group.dev.dependencies]
black = "^24.1.1"
isort = "^5.13.2"
pylint = "^3.0.3"
mypy = "^1.8.0"
pytest = "^8.0.0"
pytest-cov = "^4.1.0"
pytest-benchmark = "^4.0.0"
ipykernel = "^6.29.0"
jupyterlab = "^4.0.11"
jupyterlab-code-formatter = "^2.2.1"
jupyterlab-git = "^0.50.0"

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
plugins = ["numpy.typing.mypy_plugin"]
EOF

    # Create package.json for Node.js
    log "📝 Creating Node.js configuration..."
    sudo -u "$ORIGINAL_USER" bash -c "cat > \"$USER_HOME/workspace/gauntlet/package.json\"" << EOF
{
  "name": "gauntlet-ai",
  "version": "1.0.0",
  "description": "Gauntlet AI Development Environment",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint . --ext .ts,.js",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.17.0",
    "@tensorflow/tfjs-node-gpu": "^4.17.0",
    "onnxjs": "^0.1.8",
    "ml5": "^0.12.2",
    "brain.js": "^2.0.0-beta.23",
    "sharp": "^0.33.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "prettier": "^3.2.5",
    "ts-jest": "^29.1.2",
    "typescript": "^5.3.3"
  }
}
EOF

    # Initialize poetry environment
    log "🎯 Initializing poetry environment..."
    cd "$USER_HOME/workspace/gauntlet"
    sudo -u "$ORIGINAL_USER" bash -c "cd \"$USER_HOME/workspace/gauntlet\" && poetry install --no-interaction" || true

    # Initialize Node.js environment
    log "📦 Initializing Node.js environment..."
    sudo -u "$ORIGINAL_USER" bash -c "cd \"$USER_HOME/workspace/gauntlet\" && npm install" || true

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

# AI Development Aliases
alias train='poetry run python train.py'
alias evaluate='poetry run python evaluate.py'
alias tensorboard='poetry run tensorboard --logdir logs'
alias notebook='poetry run jupyter lab'
alias gpu-stats='nvidia-smi -l 1'
alias cpu-stats='btop'
alias benchmark='poetry run pytest --benchmark-only'
alias profile='poetry run python -m cProfile -o profile.stats'
alias analyze='poetry run python -m pstats profile.stats'
alias memory='poetry run memory_profiler'
alias optimize='sudo cpupower frequency-set -g performance'

# Node.js Development
alias ndev='npm run dev'
alias nbuild='npm run build'
alias ntest='npm run test'
alias nlint='npm run lint'
alias nformat='npm run format'

# Quick Navigation
alias models='cd ~/workspace/gauntlet/models'
alias data='cd ~/workspace/gauntlet/data'
alias experiments='cd ~/workspace/gauntlet/experiments'
alias notebooks='cd ~/workspace/gauntlet/notebooks'

# Development Tools
alias format-all='poetry run black . && poetry run isort . && npm run format'
alias lint-all='poetry run pylint . && poetry run mypy . && npm run lint'
alias test-all='poetry run pytest && npm run test'
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

# Exit on error, but allow certain commands to fail gracefully
set -eo pipefail

# Configuration
WORKSPACE_DIR="$HOME/workspace/gauntlet"
LOG_FILE="$WORKSPACE_DIR/logs/maintenance.log"
MAX_LOG_SIZE_MB=100

# Ensure log directory exists
mkdir -p "$WORKSPACE_DIR/logs"

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $((MAX_LOG_SIZE_MB * 1024 * 1024)) ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
fi

# Log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to run a command with logging and error handling
run_safely() {
    local cmd="$1"
    local desc="$2"
    log "Starting: $desc"
    if eval "$cmd" >> "$LOG_FILE" 2>&1; then
        log "✅ Completed: $desc"
        return 0
    else
        log "⚠️ Warning: $desc failed but continuing"
        return 0
    fi
}

# Change to workspace directory
cd "$WORKSPACE_DIR"

# Start maintenance
log "🔄 Starting daily maintenance"

# System updates (if running as root)
if [ "$EUID" -eq 0 ]; then
    run_safely "pacman -Sy" "Syncing package databases"
    run_safely "pacman -Sc --noconfirm" "Cleaning package cache"
fi

# Clean Python caches
run_safely "find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null" "Cleaning Python cache"
run_safely "find . -type d -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null" "Cleaning pytest cache"
run_safely "find . -type d -name '.mypy_cache' -exec rm -rf {} + 2>/dev/null" "Cleaning mypy cache"
run_safely "find . -type d -name '.ipynb_checkpoints' -exec rm -rf {} + 2>/dev/null" "Cleaning Jupyter checkpoints"

# Update dependencies
run_safely "poetry update" "Updating Python dependencies"
run_safely "npm update" "Updating Node.js dependencies"

# Run tests
run_safely "poetry run pytest --quiet" "Running Python tests"
run_safely "npm test --silent" "Running Node.js tests"

# Format code
run_safely "poetry run black . --quiet" "Formatting Python code"
run_safely "poetry run isort . --quiet" "Sorting Python imports"
run_safely "npm run format --silent" "Formatting JavaScript code"

# Clean old logs (keep last 7 days)
find "$WORKSPACE_DIR/logs" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

# Report disk usage
log "📊 Disk usage for workspace:"
du -sh "$WORKSPACE_DIR"/* 2>/dev/null | sort -hr | head -n 5 >> "$LOG_FILE"

log "✅ Daily maintenance complete"
EOF
    chmod +x "$USER_HOME/workspace/gauntlet/scripts/daily_maintenance.sh"
    chown "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/workspace/gauntlet/scripts/daily_maintenance.sh"

    # Create systemd service for automated maintenance
    log "⚙️ Setting up automated maintenance..."
    cat > /etc/systemd/system/gauntlet-maintenance.service << EOF
[Unit]
Description=Gauntlet AI Daily Maintenance
After=network.target

[Service]
Type=oneshot
User=$ORIGINAL_USER
Environment="PATH=/usr/local/bin:/usr/bin:/bin:$USER_HOME/.local/bin"
Environment="HOME=$USER_HOME"
WorkingDirectory=$USER_HOME/workspace/gauntlet
ExecStart=$USER_HOME/workspace/gauntlet/scripts/daily_maintenance.sh
Nice=19
IOSchedulingClass=idle
CPUSchedulingPolicy=idle

[Install]
WantedBy=multi-user.target
EOF

    # Create systemd timer for daily execution
    cat > /etc/systemd/system/gauntlet-maintenance.timer << EOF
[Unit]
Description=Run Gauntlet AI maintenance daily at 3am

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true
RandomizedDelaySec=1800

[Install]
WantedBy=timers.target
EOF

    # Enable and start the timer
    systemctl enable gauntlet-maintenance.timer
    systemctl start gauntlet-maintenance.timer

    # Create maintenance status check command
    cat > "$USER_HOME/workspace/gauntlet/scripts/maintenance_status.sh" << 'EOF'
#!/bin/bash
echo "=== Gauntlet AI Maintenance Status ==="
echo
echo "Last maintenance run:"
journalctl -u gauntlet-maintenance.service -n 1 --no-pager
echo
echo "Next scheduled run:"
systemctl list-timers gauntlet-maintenance.timer --no-pager
echo
echo "Recent maintenance logs:"
tail -n 20 ~/workspace/gauntlet/logs/maintenance.log
EOF
    chmod +x "$USER_HOME/workspace/gauntlet/scripts/maintenance_status.sh"
    chown "$ORIGINAL_USER:$ORIGINAL_USER" "$USER_HOME/workspace/gauntlet/scripts/maintenance_status.sh"

    # Add maintenance status alias
    sudo -u "$ORIGINAL_USER" bash -c "cat >> \"$USER_HOME/.zshrc\"" << 'EOF'

# Maintenance status
alias mstatus='~/workspace/gauntlet/scripts/maintenance_status.sh'
EOF

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