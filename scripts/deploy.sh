#!/bin/bash
set -e

# Load environment variables
source .env

# Health check before deployment
echo "Running pre-deployment health check..."
python scripts/health_check.py

if [ $? -ne 0 ]; then
    echo "Pre-deployment health check failed!"
    exit 1
fi

# Start services
docker-compose up -d

# Post-deployment health check
echo "Running post-deployment health check..."
sleep 5  # Wait for services to start
python scripts/health_check.py

if [ $? -ne 0 ]; then
    echo "Post-deployment health check failed! Rolling back..."
    docker-compose down
    exit 1
fi

echo "Deployment successful!" 