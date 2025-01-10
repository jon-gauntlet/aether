#!/bin/bash

# Pacman Configuration Cleanup Script
# Run with: sudo ./02_cleanup_pacman.sh

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

echo "Cleaning up pacman configuration..."

# Create backup of current pacman.conf
cp /etc/pacman.conf /etc/pacman.conf.bak

# Remove any AI repository entries
sed -i '/^\[ai\]/,/^$/{/^\[ai\]/!{/^$/!d}};/^\[ai\]/d' /etc/pacman.conf

# Remove any other custom repository entries that might cause issues
sed -i '/^Include = \/etc\/pacman.d\/ai/d' /etc/pacman.conf

# Clean up package cache
pacman -Sc --noconfirm

# Update package databases
pacman -Sy

# Move this script to applied directory
mv "$0" "$(dirname "$0")/../applied/"

echo "Pacman configuration cleaned up successfully." 