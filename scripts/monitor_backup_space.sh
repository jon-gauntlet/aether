#!/bin/bash
# Aether WebSocket Service Backup Space Monitor
# 

set -e

# Configuration
BACKUP_PATH="/var/backups/websocket"
THRESHOLD_PERCENT=90
NOTIFY_EMAIL="admin@example.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/your-webhook-url"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Logging function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Send email notification
send_email() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" "$NOTIFY_EMAIL"
}

# Send Slack notification
send_slack() {
    local message="$1"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        "$SLACK_WEBHOOK_URL"
}

# Get disk usage for backup directory
get_disk_usage() {
    df -h "$BACKUP_PATH" | awk 'NR==2 {print $5}' | sed 's/%//'
}

# Get total backup size
get_backup_size() {
    du -sh "$BACKUP_PATH" | awk '{print $1}'
}

# Check individual backup directories
check_directories() {
    local warnings=()
    
    for dir in "$BACKUP_PATH"/*; do
        if [ -d "$dir" ]; then
            local size=$(du -sh "$dir" | awk '{print $1}')
            local count=$(find "$dir" -type f | wc -l)
            log "${GREEN}Directory: $(basename "$dir")${NC}"
            log "- Size: $size"
            log "- Files: $count"
            
            # Check for large files (>1GB)
            local large_files=$(find "$dir" -type f -size +1G)
            if [ ! -z "$large_files" ]; then
                warnings+=("Large files found in $(basename "$dir"): $large_files")
            fi
            
            # Check for old files (>60 days)
            local old_files=$(find "$dir" -type f -mtime +60)
            if [ ! -z "$old_files" ]; then
                warnings+=("Old files found in $(basename "$dir"): $old_files")
            fi
        fi
    done
    
    # Report warnings
    if [ ${#warnings[@]} -gt 0 ]; then
        log "${YELLOW}Warnings:${NC}"
        printf '%s\n' "${warnings[@]}"
    fi
}

# Main monitoring function
monitor_space() {
    log "${GREEN}Starting backup space monitoring...${NC}"
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_PATH" ]; then
        log "${RED}Error: Backup directory does not exist${NC}"
        send_email "Backup Space Monitor - Error" "Backup directory does not exist: $BACKUP_PATH"
        send_slack "🚨 Backup Space Monitor - Error: Backup directory does not exist"
        exit 1
    fi
    
    # Get current usage
    local usage=$(get_disk_usage)
    local total_size=$(get_backup_size)
    
    log "Backup directory: $BACKUP_PATH"
    log "Total size: $total_size"
    log "Disk usage: $usage%"
    
    # Check individual directories
    check_directories
    
    # Check if usage exceeds threshold
    if [ "$usage" -gt "$THRESHOLD_PERCENT" ]; then
        local message="Warning: Backup disk usage is at ${usage}% (threshold: ${THRESHOLD_PERCENT}%)"
        log "${RED}$message${NC}"
        send_email "Backup Space Monitor - Warning" "$message"
        send_slack "⚠️ $message"
        
        # List largest files
        log "${YELLOW}Largest files:${NC}"
        find "$BACKUP_PATH" -type f -exec du -h {} + | sort -rh | head -n 10
        
        # Suggest cleanup
        log "${YELLOW}Suggested actions:${NC}"
        log "1. Review and remove old backups"
        log "2. Increase backup storage"
        log "3. Adjust retention policy"
    else
        log "${GREEN}Space usage is within acceptable limits${NC}"
    fi
}

# Run monitoring
monitor_space 