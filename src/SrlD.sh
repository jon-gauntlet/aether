#!/bin/bash

# Install g command system
echo "Installing Gauntlet Command Suite..."

# Install dependencies
if command -v pacman &> /dev/null; then
    sudo pacman -S --needed jq libnotify cpupower inotify-tools systemd-libs
fi

# Copy command scripts
sudo cp g_command.sh /usr/local/bin/g
sudo cp focus-mode-manager /usr/local/bin/focus-mode-manager
sudo chmod +x /usr/local/bin/g /usr/local/bin/focus-mode-manager

# Install systemd units
sudo cp gauntlet-dirs.service /etc/systemd/system/
sudo cp gauntlet-focus.slice /etc/systemd/system/
sudo cp gauntlet-focus.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable gauntlet-dirs.service gauntlet-focus.service
sudo systemctl start gauntlet-dirs.service gauntlet-focus.service

# Create initial directories
mkdir -p ~/.config/gauntlet
mkdir -p ~/.local/state/gauntlet
mkdir -p ~/.local/share/gauntlet
mkdir -p ~/brainlifts
mkdir -p ~/.local/share/gauntlet/notes

# Add g command to shell profile
if ! grep -q "source /usr/local/bin/g" ~/.zshrc; then
    echo "source /usr/local/bin/g" >> ~/.zshrc
fi

# Set up initial configuration
cat > ~/.config/gauntlet/focus.conf << EOL
# Gauntlet Focus Configuration

# Deep mode settings
BLOCK_NOTIFICATIONS=true
BLOCK_SOCIAL_MEDIA=true
MUTE_AUDIO=false

# Flow mode settings
CPU_GOVERNOR=performance
IO_PRIORITY=high
MEMORY_TRIM=true

# Timer settings
POMODORO_LENGTH=25
BREAK_LENGTH=5
LONG_BREAK_LENGTH=15
EOL

echo "Installation complete!"
echo "Please restart your shell or run: source ~/.zshrc" 