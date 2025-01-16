#!/bin/bash

# <!-- LLM:component SLED_CLEANUP -->
# <!-- LLM:claude I handle file cleanup and maintenance -->

set -euo pipefail

# Load SLED environment
source "$SLED_PROJECT_ROOT/sled/env.sh"

# Known good files/patterns
WHITELIST=(
    '.git'
    'pyproject.toml'
    'poetry.lock'
    'README.md'
    'src/'
    'tests/'
    'sled/'
    '.env'
    '.gitignore'
    'docs/'
    'scripts/'
    'config/'
)

# Files that should never exist
BLACKLIST=(
    '*.pyc'
    '__pycache__'
    '.pytest_cache'
    '.coverage'
    'htmlcov'
    '.DS_Store'
    '*.swp'
    '*.swo'
    'node_modules'
    '.env.local'
    'tmp/'
)

# Scan for unknown files
scan_unknown() {
    local whitelist_pattern=""
    for pattern in "${WHITELIST[@]}"; do
        whitelist_pattern="$whitelist_pattern -not -path '*/$pattern' -not -path '*/$pattern/*'"
    done
    
    echo "🔍 Scanning for unknown files..."
    eval "find . -type f $whitelist_pattern -not -path './.*'"
}

# Clean known bad files
clean_blacklist() {
    echo "🧹 Cleaning known bad files..."
    for pattern in "${BLACKLIST[@]}"; do
        find . -name "$pattern" -exec rm -rf {} + 2>/dev/null || true
    done
}

# Archive unknown files
archive_unknown() {
    local unknown_files=$(scan_unknown)
    if [ -n "$unknown_files" ]; then
        echo "📦 Archiving unknown files..."
        local archive_dir="$SLED_PROJECT_DIR/.archive/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$archive_dir"
        
        echo "$unknown_files" | while read -r file; do
            if [ -f "$file" ]; then
                mkdir -p "$archive_dir/$(dirname "$file")"
                mv "$file" "$archive_dir/$file"
                echo "Archived: $file"
            fi
        done
    fi
}

# Clean empty directories
clean_empty_dirs() {
    echo "🗑️ Cleaning empty directories..."
    find . -type d -empty -not -path '*/\.*' -delete
}

# Main cleanup function
main() {
    echo "🛷 Running SLED cleanup..."
    
    # Check energy level
    local energy=$(get_energy)
    if [ "$energy" -lt 50 ]; then
        echo "⚠️ Energy too low for cleanup. Please restore energy first."
        exit 1
    fi
    
    # Create backup
    echo "💾 Creating backup..."
    local backup_dir="$SLED_PROJECT_DIR/.backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    rsync -a --exclude '.git' --exclude 'sled/.backup' . "$backup_dir/"
    
    # Run cleanup steps
    clean_blacklist
    archive_unknown
    clean_empty_dirs
    
    # Update energy
    update_energy -10
    
    echo "✨ Cleanup complete!"
    echo "📁 Unknown files archived in: $SLED_PROJECT_DIR/.archive/"
    echo "💾 Backup created in: $backup_dir"
    echo "⚡ Energy: $(get_energy)"
}

main "$@"

# <!-- LLM:verify Cleanup is essential for maintaining a clean workspace -->
# <!-- LLM:usage Last updated: 2024-01-16 --> 