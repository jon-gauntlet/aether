#!/bin/bash

echo "🔥 PURGING ALL NON-GAUNTLET CONTENT 🔥"

# Backup critical configs
mkdir -p ~/system_backups/configs_pre_purge
cp ~/.zshrc ~/.gitconfig ~/.ssh ~/system_backups/configs_pre_purge/ -r

# Remove all dot directories and files that aren't essential
echo "Removing non-essential dot files and directories..."
rm -rf ~/.aws
rm -rf ~/.azure
rm -rf ~/.BurpSuite
rm -rf ~/.cargo
rm -rf ~/.cmake
rm -rf ~/.foundry
rm -rf ~/.gradle
rm -rf ~/.java
rm -rf ~/.librewolf
rm -rf ~/.logseq
rm -rf ~/.mongodb
rm -rf ~/.mozilla
rm -rf ~/.msf4
rm -rf ~/.npm
rm -rf ~/.projectlibre
rm -rf ~/.rbenv
rm -rf ~/.rvm
rm -rf ~/.semgrep
rm -rf ~/.terraform.d
rm -rf ~/.texlive
rm -rf ~/.vscode-oss
rm -rf ~/.wapiti
rm -rf ~/.yarn
rm -rf ~/.ZAP
rm -rf ~/.zoom
rm -rf ~/.metsploit-gems

# Remove cache and history files
echo "Cleaning caches and histories..."
rm -rf ~/.cache/*
rm -f ~/.bash_history
rm -f ~/.python_history
rm -f ~/.zsh_history
rm -f ~/.node_repl_history
rm -f ~/.irb-history
rm -f ~/.sqlite_history

# Remove non-essential home directories
echo "Removing non-essential directories..."
rm -rf ~/Desktop
rm -rf ~/Downloads/*  # Keep directory but clear contents
rm -rf ~/archive
rm -rf ~/logseq
rm -rf ~/media
rm -rf ~/resources
rm -rf ~/temp
rm -rf ~/system_info
rm -rf ~/go
rm -rf ~/git

# Clear package managers
echo "Removing unnecessary packages..."
sudo pacman -Rns --noconfirm discord telegram-desktop steam libreoffice gimp vlc
sudo pacman -Scc --noconfirm  # Clear package cache

# Remove non-essential Python packages
echo "Cleaning Python environment..."
pip freeze | grep -v "pytest|black|mypy|jupyter|notebook|requests|numpy|pandas" | xargs pip uninstall -y

# Create minimal directory structure
echo "Creating minimal Gauntlet structure..."
mkdir -p ~/Documents/{notes,templates,resources,exercises,algorithms}
mkdir -p ~/workspace/gauntlet/{week{1..12},utils}
mkdir -p ~/scripts/{automation,monitoring,tools}
mkdir -p ~/Pictures/progress/{screenshots,diagrams,metrics}
mkdir -p ~/Music/focus/{coding,learning,deep_work}
mkdir -p ~/Videos/tutorials

# Set up minimal .zshrc
echo "Configuring minimal shell..."
cat > ~/.zshrc << 'EOL'
# Minimal Gauntlet-focused configuration
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
plugins=(git)
source $ZSH/oh-my-zsh.sh

# Gauntlet Environment
export GAUNTLET_START="2024-01-06"
export WORK_HOURS=100
export POMODORO_LENGTH=25
export PYTHONPATH="$HOME/workspace/gauntlet"

# Focus aliases
alias daily="cp ~/Documents/templates/daily.md ~/Documents/notes/$(date +%Y-%m-%d).md"
alias pomodoro="timer ${POMODORO_LENGTH}m"
alias break="timer 5m && notify-send 'Break Over!'"
alias focus-check="~/scripts/monitoring/focus-check.sh"

# Quick navigation
alias gw="cd ~/workspace/gauntlet"
alias gn="cd ~/Documents/notes"
alias gt="cd ~/Documents/templates"

# Git shortcuts
alias gs="git status"
alias gc="git commit -m"
alias gp="git push"
alias gl="git log --oneline -n 5"

# Python
alias py="python3"
alias jl="jupyter lab"

# Block distractions
alias youtube-dl="echo 'Focus on Gauntlet!' && return 1"
alias netflix="echo 'Focus on Gauntlet!' && return 1"
EOL

# Set up minimal .gitconfig
cat > ~/.gitconfig << 'EOL'
[user]
    name = Gauntlet Warrior
    email = your.email@example.com
[core]
    editor = nvim
[init]
    defaultBranch = main
[pull]
    rebase = false
EOL

# Create a hosts file entry to block distracting sites
echo "Blocking distracting websites..."
sudo tee -a /etc/hosts << 'EOL'
# Gauntlet Focus Blocks
127.0.0.1 youtube.com www.youtube.com
127.0.0.1 netflix.com www.netflix.com
127.0.0.1 facebook.com www.facebook.com
127.0.0.1 twitter.com www.twitter.com
127.0.0.1 instagram.com www.instagram.com
127.0.0.1 reddit.com www.reddit.com
127.0.0.1 tiktok.com www.tiktok.com
EOL

# Set up minimal neovim config for coding
mkdir -p ~/.config/nvim
cat > ~/.config/nvim/init.vim << 'EOL'
set number
set relativenumber
set expandtab
set tabstop=4
set shiftwidth=4
set autoindent
set smartindent
syntax enable
EOL

echo "🎯 System purged and optimized for Gauntlet success!"
echo "Please restart your system for all changes to take effect." 