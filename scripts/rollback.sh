#!/bin/bash
set -e

echo "Starting emergency rollback..."

# Stop all services
docker-compose down

# Remove volumes if specified
if [ "$1" == "--clean" ]; then
    echo "Removing volumes..."
    docker volume rm $(docker volume ls -q | grep redis_data) || true
fi

# Restart with previous known good state
if [ -f ".env.backup" ]; then
    echo "Restoring from backup environment..."
    cp .env.backup .env
fi

echo "Restarting services..."
docker-compose up -d

# Wait for services to start
sleep 5

# Verify health
python scripts/health_check.py
if [ $? -ne 0 ]; then
    echo "WARNING: Services unhealthy after rollback!"
    exit 1
fi

echo "Rollback complete" 