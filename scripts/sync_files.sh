#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting file sync...${NC}"

# Function to sync files
sync_directory() {
    local src_dir="$1"
    local dest_dir="$2"
    
    # Create destination directory if it doesn't exist
    mkdir -p "$dest_dir"
    
    # Copy files, preserving newer files at destination
    rsync -av --update "$src_dir/" "$dest_dir/"
}

# Sync tests directory
if [ -d "/home/jon/empty/tests" ]; then
    echo -e "${YELLOW}Syncing tests directory...${NC}"
    sync_directory "/home/jon/empty/tests" "/home/jon/projects/aether/tests"
fi

# Sync src directory
if [ -d "/home/jon/empty/src" ]; then
    echo -e "${YELLOW}Syncing src directory...${NC}"
    sync_directory "/home/jon/empty/src" "/home/jon/projects/aether/src"
fi

# Sync any other files in root
echo -e "${YELLOW}Syncing root files...${NC}"
for file in /home/jon/empty/*; do
    if [ -f "$file" ]; then
        base_name=$(basename "$file")
        dest_file="/home/jon/projects/aether/$base_name"
        if [ ! -f "$dest_file" ] || [ "$file" -nt "$dest_file" ]; then
            cp -v "$file" "$dest_file"
        fi
    fi
done

echo -e "${GREEN}File sync completed${NC}" 