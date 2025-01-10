#!/bin/bash

# Create system changes directory structure
mkdir -p ~/scripts/system_changes/{pending,applied}

# Create a README
cat > ~/scripts/system_changes/README.md << 'EOF'
# System Changes Directory

This directory contains scripts for system changes that require elevated privileges.

## Usage
1. Scripts are numbered sequentially (00_, 01_, etc.)
2. Place new scripts in `pending/`
3. Run from terminal with: `sudo ./pending/XX_script_name.sh`
4. After successful execution, move to `applied/`

## Never
- Never edit system files directly in Cursor
- Never try to use sudo in Cursor UI
- Never edit files outside your home directory in Cursor

## Always
- Write changes to ~/scripts/system_changes/pending/
- Run changes from terminal
- Keep track of applied changes
EOF

# Make this script executable
chmod +x ~/scripts/system_changes/00_setup_script_dir.sh

echo "System changes directory structure created at ~/scripts/system_changes/"
echo "Please read the README.md for usage instructions." 