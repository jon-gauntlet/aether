#!/bin/bash

# Aether Project Recovery Script
# This script helps recover project files from Cursor editor history

CURSOR_HISTORY="/home/jon/.config/Cursor/User/History"
PROJECT_ROOT="$(pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$PROJECT_ROOT/src/core/energy"
mkdir -p "$PROJECT_ROOT/src/core/patterns"
mkdir -p "$PROJECT_ROOT/src/core/hooks"
mkdir -p "$PROJECT_ROOT/src/core/types"
mkdir -p "$PROJECT_ROOT/src/core/context"
mkdir -p "$PROJECT_ROOT/src/core/autonomic"
mkdir -p "$PROJECT_ROOT/src/core/flow"
mkdir -p "$PROJECT_ROOT/src/core/integration"
mkdir -p "$PROJECT_ROOT/src/components"
mkdir -p "$PROJECT_ROOT/src/styles"

# Function to find most recent version of a file
find_latest_version() {
    local pattern="$1"
    local latest=$(find "$CURSOR_HISTORY" -type f -name "$pattern" -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    echo "$latest"
}

# Backup existing files
echo "Creating backup..."
if [ -d "$PROJECT_ROOT/src" ]; then
    cp -r "$PROJECT_ROOT/src" "$BACKUP_DIR/"
fi

# Core files to recover
declare -A files_to_recover=(
    ["types.ts"]="src/core/energy/types.ts"
    ["useEnergy.ts"]="src/core/energy/useEnergy.ts"
    ["AutonomicDevelopment.tsx"]="src/components/AutonomicDevelopment.tsx"
    ["EnergyAware.tsx"]="src/components/EnergyAware.tsx"
    ["PatternGuided.tsx"]="src/components/PatternGuided.tsx"
)

# Recover each file
echo "Starting file recovery..."
for file in "${!files_to_recover[@]}"; do
    target="${files_to_recover[$file]}"
    latest=$(find_latest_version "*$file")
    
    if [ ! -z "$latest" ]; then
        echo "Recovering $file to $target..."
        cp "$latest" "$PROJECT_ROOT/$target"
    else
        echo "Could not find $file in history"
    fi
done

# Install dependencies
echo "Installing dependencies..."
npm install

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial recovery commit"
fi

echo "Recovery complete. Please check RECOVERY.md for status and next steps." 