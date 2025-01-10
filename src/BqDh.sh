#!/bin/bash

echo "Optimizing system for Gauntlet AI..."

# Create backup of important configs
mkdir -p ~/system_backups/configs_pre_gauntlet
cp ~/.zshrc ~/system_backups/configs_pre_gauntlet/
cp ~/.gitconfig ~/system_backups/configs_pre_gauntlet/

# Remove non-essential directories
rm -rf ~/archive
rm -rf ~/Desktop
rm -rf ~/logseq
rm -rf ~/media
rm -rf ~/resources
rm -rf ~/temp
rm -rf ~/system_info
rm -rf ~/notes.md
rm -rf ~/thresholds_new.pnm
rm -rf ~/ente.log

# Clean and reorganize essential directories
mkdir -p ~/Documents/{notes,templates,resources,exercises,algorithms}
mkdir -p ~/workspace/{projects,experiments,tests}
mkdir -p ~/scripts/{automation,monitoring,tools}
mkdir -p ~/Pictures/progress/{screenshots,diagrams,metrics}
mkdir -p ~/Music/focus/{coding,learning,deep_work}
mkdir -p ~/Videos/tutorials

# Create essential Gauntlet directories
mkdir -p ~/workspace/gauntlet/{week1,week2,week3,week4}  # Remote phase
mkdir -p ~/workspace/gauntlet/{week5,week6,week7,week8,week9,week10,week11,week12}  # Austin phase

# Set up git structure
cd ~/workspace/gauntlet
git init
touch .gitignore
echo "node_modules/" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
echo ".env" >> .gitignore
echo ".DS_Store" >> .gitignore

# Create first day's note
cp ~/Documents/templates/daily.md ~/Documents/notes/$(date +%Y-%m-%d).md

# Set up Python environment
python -m venv ~/workspace/gauntlet/venv
source ~/workspace/gauntlet/venv/bin/activate
pip install pytest black mypy jupyter notebook requests numpy pandas

echo "System optimization complete!" 