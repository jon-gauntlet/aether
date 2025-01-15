#!/bin/bash

# Health check script for deployment verification
# Usage: ./health_check.sh <endpoint_url>

set -e

ENDPOINT_URL=$1
MAX_RETRIES=30
RETRY_INTERVAL=10

if [ -z "$ENDPOINT_URL" ]; then
    echo "Error: Endpoint URL not provided"
    echo "Usage: $0 <endpoint_url>"
    exit 1
fi

echo "Starting health check for $ENDPOINT_URL"
echo "Maximum retries: $MAX_RETRIES"
echo "Retry interval: $RETRY_INTERVAL seconds"

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i of $MAX_RETRIES..."
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT_URL" || true)
    
    if [ "$RESPONSE" = "200" ]; then
        echo "Health check passed! Service is healthy."
        
        # Verify response content
        CONTENT=$(curl -s "$ENDPOINT_URL")
        if echo "$CONTENT" | grep -q '"status":"healthy"'; then
            echo "Service status confirmed healthy"
            exit 0
        else
            echo "Warning: Unexpected response content"
            echo "$CONTENT"
        fi
    fi
    
    echo "Service not healthy yet (HTTP $RESPONSE). Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
done

echo "Error: Health check failed after $MAX_RETRIES attempts"
exit 1 