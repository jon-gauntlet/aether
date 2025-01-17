#!/bin/bash
set -e

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup environment files
cp .env "$BACKUP_DIR/.env.backup"
cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml.backup"

# Create Redis dump if possible
if [ "$(docker ps -q -f name=redis)" ]; then
    echo "Backing up Redis data..."
    docker exec redis redis-cli SAVE
    docker cp redis:/data/dump.rdb "$BACKUP_DIR/redis-dump.rdb"
fi

echo "Backup complete: $BACKUP_DIR" 