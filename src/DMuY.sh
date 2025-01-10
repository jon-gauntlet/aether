#!/bin/bash

# Define the configuration to add
CONFIG="
# Add cross-platform clipboard support (pbcopy/pbpaste)
if command -v xclip >/dev/null 2>&1; then
    alias pbcopy='xclip -selection c'
    alias pbpaste='xclip -selection c -o'
elif command -v xsel >/dev/null 2>&1; then
    alias pbcopy='xsel --clipboard --input'
    alias pbpaste='xsel --clipboard --output'
fi"

# Check if xclip is installed, if not install it
if ! command -v xclip &> /dev/null; then
    echo "Installing xclip..."
    sudo pacman -S --noconfirm xclip
fi

# Check if the configuration already exists in .zshrc
if ! grep -q "alias pbcopy='xclip -selection c'" ~/.zshrc; then
    echo "$CONFIG" >> ~/.zshrc
    echo "Added pbcopy/pbpaste configuration to .zshrc"
    echo -e "\nTo activate the changes, please run:\n"
    echo "    source ~/.zshrc"
    echo -e "\nOr open a new terminal window"
else
    echo "pbcopy/pbpaste configuration already exists in .zshrc"
fi

echo "Setup complete! Try using pbcopy/pbpaste" 