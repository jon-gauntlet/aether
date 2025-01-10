#!/bin/bash

# Backup function
backup_and_remove() {
    local path="$1"
    if [ -e "$path" ]; then
        echo "Backing up $path..."
        tar czf "$HOME/system_backups/dotfiles/$(basename $path).tar.gz" "$path"
        echo "Removing $path..."
        rm -rf "$path"
    fi
}

# Create backup directory
mkdir -p "$HOME/system_backups/dotfiles"

# Development tools cleanup
echo "Cleaning up unused development tools..."

# Java-related (uncomment if not using Java)
#backup_and_remove "$HOME/.gradle"
#backup_and_remove "$HOME/.java"

# Project management (uncomment if not using ProjectLibre)
#backup_and_remove "$HOME/.projectlibre"

# Terraform (uncomment if not using Terraform)
#backup_and_remove "$HOME/.terraform.d"

# LaTeX (uncomment if not using LaTeX)
#backup_and_remove "$HOME/.texlive"

# Ethereum (uncomment if not using Foundry)
#backup_and_remove "$HOME/.foundry"

# Cache cleanup
echo "Cleaning up caches..."
find "$HOME/.cache" -type f -atime +30 -delete
find "$HOME/.cache" -type d -empty -delete

# Clean old logs
echo "Cleaning up old logs..."
find "$HOME" -name "*.log" -type f -mtime +30 -delete

# Clean package manager caches
echo "Cleaning package manager caches..."
paccache -r  # Keep only the last 3 versions of each package

# Clean old zcompdump files
echo "Cleaning old zcompdump files..."
find "$HOME" -name '.zcompdump*' ! -name '.zcompdump-*-5.9*' -delete

echo "Cleanup complete! Backups stored in $HOME/system_backups/dotfiles/" 