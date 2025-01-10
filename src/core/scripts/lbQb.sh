#!/bin/bash

# Set strict mode
set -euo pipefail

# Base directories
REPO_DIR="/home/jon/security-assessment"
TARGET_APP_DIR="/home/jon/git/app-sec-exercise"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[+]${NC} $1"
}

error() {
    echo -e "${RED}[!]${NC} $1"
}

# Clean up temporary files and caches
cleanup_temp_files() {
    log "Cleaning temporary files and caches..."
    find "$REPO_DIR" -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*~" -o -name "*.pyc" \) -delete
    find "$REPO_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$REPO_DIR" -type f -name ".DS_Store" -delete
}

# Clean up log files except essential ones and preserve metasploit logs
cleanup_logs() {
    log "Processing log files..."
    
    # First rename metasploit logs to preserve them
    find "$REPO_DIR" -type f -path "*/metasploit/*.log" -exec sh -c '
        for file do
            mv "$file" "${file%.log}.msf"
        done
    ' sh {} +
    
    # Then delete other log files except essential ones
    find "$REPO_DIR" -type f -name "*.log" ! -name "etl-process.log" -delete
}

# Standardize directory structure
standardize_directories() {
    log "Standardizing directory structure..."
    
    # Create standard directories if they don't exist
    mkdir -p "$REPO_DIR"/{findings/{code-llm,sast,dast},data/normalized_findings,scripts/{data_processing,etl_pipeline},logs,reports}
    
    # Ensure correct permissions
    find "$REPO_DIR" -type d -exec chmod 755 {} \;
    find "$REPO_DIR" -type f -exec chmod 644 {} \;
}

# Fix logging paths
fix_logging_setup() {
    log "Updating logging configuration..."
    mkdir -p "$REPO_DIR/logs"
    touch "$REPO_DIR/logs/etl-process.log"
    chmod 644 "$REPO_DIR/logs/etl-process.log"
}

# Main execution
main() {
    log "Starting repository cleanup and optimization..."
    
    cleanup_temp_files
    cleanup_logs
    standardize_directories
    fix_logging_setup
    
    log "Cleanup complete!"
}

# Run main function
main 