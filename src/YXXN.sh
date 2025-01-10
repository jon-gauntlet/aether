#!/bin/bash

# Install g command system
echo "Installing Gauntlet Command Suite..."

# Copy g command script
sudo cp g_command.sh /usr/local/bin/g
sudo chmod +x /usr/local/bin/g

# Install systemd service
sudo cp gauntlet-dirs.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gauntlet-dirs.service
sudo systemctl start gauntlet-dirs.service

# Create initial directories
mkdir -p ~/.config/gauntlet
mkdir -p ~/.local/state/gauntlet
mkdir -p ~/.local/share/gauntlet
mkdir -p ~/brainlifts

# Add g command to shell profile
if ! grep -q "source /usr/local/bin/g" ~/.zshrc; then
    echo "source /usr/local/bin/g" >> ~/.zshrc
fi

# Install dependencies
if command -v pacman &> /dev/null; then
    sudo pacman -S --needed jq libnotify cpupower
fi

echo "Installation complete!"
echo "Please restart your shell or run: source ~/.zshrc" 