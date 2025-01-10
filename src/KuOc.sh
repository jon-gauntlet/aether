#!/bin/bash

# Setup script for Cursor context preservation services
set -euo pipefail

# Ensure directories exist
mkdir -p ~/.config/systemd/user
mkdir -p ~/.local/state/cursor/{autonomic,backups,processed,meta,harmony,focus}
mkdir -p ~/.local/share/cursor/{crystallized,cache,logs,state,metrics}/{current,historical}
mkdir -p ~/.config/cursor/contexts/{system,general,projects,sacred,gauntlet}

# Make scripts executable
chmod +x ~/scripts/cursor/context-crystallizer
chmod +x ~/scripts/cursor/autonomic-manager
chmod +x ~/scripts/cursor/meta-learner
chmod +x ~/scripts/cursor/essence-harmonizer
chmod +x ~/scripts/cursor/focus-enhancer

# Create cursor-autonomic slice
cat > ~/.config/systemd/user/cursor-autonomic.slice <<EOF
[Unit]
Description=Cursor Autonomic Resource Management
Documentation=https://sre.google/sre-book/table-of-contents/
Before=cursor-context.slice

[Slice]
CPUWeight=95
IOWeight=95
MemoryHigh=12G
MemoryMax=14G
TasksMax=200

# Autonomic Controls
ResourceControl=true
ResourcePolicy=balanced
Delegate=true
EOF

# Create cursor-context slice
cat > ~/.config/systemd/user/cursor-context.slice <<EOF
[Unit]
Description=Cursor Context Management Slice
Documentation=https://sre.google/sre-book/table-of-contents/
After=cursor-autonomic.slice

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=8G
TasksMax=100
EOF

# Install service files
cp ~/scripts/cursor/context-crystallizer.service ~/.config/systemd/user/
cp ~/scripts/cursor/essence-integrator.service ~/.config/systemd/user/
cp ~/scripts/cursor/autonomic-manager.service ~/.config/systemd/user/
cp ~/scripts/cursor/meta-learner.service ~/.config/systemd/user/
cp ~/scripts/cursor/essence-harmonizer.service ~/.config/systemd/user/
cp ~/scripts/cursor/focus-enhancer.service ~/.config/systemd/user/

# Initialize learning state
if [[ ! -f ~/.local/state/cursor/autonomic/learning.json ]]; then
    echo '{
        "patterns": [],
        "last_updated": 0,
        "version": 1
    }' > ~/.local/state/cursor/autonomic/learning.json
fi

# Initialize meta-learning state
if [[ ! -f ~/.local/state/cursor/meta/state.json ]]; then
    echo '{
        "version": 1,
        "last_update": 0,
        "patterns": [],
        "meta_patterns": [],
        "correlations": {},
        "insights": []
    }' > ~/.local/state/cursor/meta/state.json
fi

# Initialize harmony state
if [[ ! -f ~/.local/state/cursor/harmony/state.json ]]; then
    echo '{
        "version": 1,
        "last_update": 0,
        "harmony_score": 0.5,
        "patterns": [],
        "insights": []
    }' > ~/.local/state/cursor/harmony/state.json
fi

# Initialize focus state
if [[ ! -f ~/.local/state/cursor/focus/state.json ]]; then
    echo '{
        "version": 1,
        "last_update": 0,
        "focus_state": "normal",
        "patterns": [],
        "insights": []
    }' > ~/.local/state/cursor/focus/state.json
fi

# Ensure zstd is installed for compression
if ! command -v zstd &>/dev/null; then
    echo "Installing zstd for efficient compression..."
    sudo pacman -S --noconfirm zstd
fi

# Ensure libnotify is installed for focus notifications
if ! command -v notify-send &>/dev/null; then
    echo "Installing libnotify for focus notifications..."
    sudo pacman -S --noconfirm libnotify
fi

# Reload systemd user daemon
systemctl --user daemon-reload

# Enable and start services in correct order
systemctl --user enable --now cursor-autonomic.slice
systemctl --user enable --now cursor-context.slice
systemctl --user enable --now meta-learner.service
systemctl --user enable --now autonomic-manager.service
systemctl --user enable --now essence-harmonizer.service
systemctl --user enable --now focus-enhancer.service
systemctl --user enable --now context-crystallizer.service
systemctl --user enable --now essence-integrator.service

echo "Context preservation, autonomic management, meta-learning, harmony, and focus services installed and started"
echo "Checking status..."

systemctl --user status cursor-autonomic.slice
systemctl --user status cursor-context.slice
systemctl --user status meta-learner.service
systemctl --user status autonomic-manager.service
systemctl --user status essence-harmonizer.service
systemctl --user status focus-enhancer.service
systemctl --user status context-crystallizer.service
systemctl --user status essence-integrator.service

# Create symbolic links for quick access
mkdir -p ~/bin
ln -sf ~/scripts/cursor/meta-learner ~/bin/cursor-meta
ln -sf ~/scripts/cursor/autonomic-manager ~/bin/cursor-auto
ln -sf ~/scripts/cursor/context-crystallizer ~/bin/cursor-crystal
ln -sf ~/scripts/cursor/essence-harmonizer ~/bin/cursor-harmony
ln -sf ~/scripts/cursor/focus-enhancer ~/bin/cursor-focus

# Create convenience aliases
cat >> ~/.zshrc <<EOF

# Cursor Enhancement Aliases
alias cfocus='cursor-focus status'
alias charmony='cursor-harmony status'
alias cmeta='cursor-meta status'
alias cauto='cursor-auto status'
alias ccrystal='cursor-crystal status'
EOF

echo "Setup complete. System is ready for high-load development sessions."
echo "Use the following commands to monitor system state:"
echo "  cfocus    - Check focus state"
echo "  charmony  - Check system harmony"
echo "  cmeta     - Check meta-learning status"
echo "  cauto     - Check autonomic management"
echo "  ccrystal  - Check context crystallization" 