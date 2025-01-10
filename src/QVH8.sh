#!/bin/bash

# Backup current package list
echo "Creating package backup list..."
pacman -Qe > packages_backup_$(date +%Y%m%d).txt

# Remove gaming related packages
echo "Removing gaming related packages..."
sudo pacman -Rns --noconfirm calligra

# Remove unnecessary multimedia packages
echo "Removing unnecessary multimedia packages..."
sudo pacman -Rns --noconfirm \
    haruna \
    k3b \
    kamoso \
    kdenlive \
    projectlibre

# Remove unused development packages
echo "Removing unused development packages..."
sudo pacman -Rns --noconfirm \
    ant \
    cauchy \
    gradle7 \
    haskell-* \
    ruby-build \
    rbenv

# Remove unnecessary graphics packages
echo "Removing graphics packages..."
sudo pacman -Rns --noconfirm \
    digikam \
    gwenview \
    inkscape \
    okular

# Remove extra fonts
echo "Removing extra fonts..."
sudo pacman -Rns --noconfirm \
    ttf-caladea \
    ttf-carlito \
    ttf-croscore \
    ttf-dejavu \
    ttf-liberation \
    ttf-opensans \
    ttf-quintessential \
    ttf-signika

# Remove unnecessary system utilities
echo "Removing unnecessary system utilities..."
sudo pacman -Rns --noconfirm \
    filelight \
    kbackup \
    kcalc \
    kcharselect \
    kdf \
    kgpg \
    kmag \
    kmousetool \
    kmouth \
    ktimer

# Clean up dependencies
echo "Cleaning up dependencies..."
sudo pacman -Rns $(pacman -Qdtq)

# Clean package cache
echo "Cleaning package cache..."
sudo pacman -Sc --noconfirm

echo "Package cleanup complete!"
echo "If you need to restore packages, check packages_backup_$(date +%Y%m%d).txt" 