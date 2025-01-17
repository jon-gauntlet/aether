#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check required environment variables
if [ -z "$STACK_NAME" ]; then
    echo -e "${RED}Error: STACK_NAME environment variable not set${NC}"
    exit 1
fi

CLUSTER_ID="${STACK_NAME}-redis"

echo "Monitoring Redis cluster and snapshot status..."
echo "Press Ctrl+C to stop monitoring"

while true; do
    clear
    echo "Time: $(date)"
    echo "Cluster: $CLUSTER_ID"
    echo "----------------------------------------"
    
    # Get cluster status
    STATUS=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "$CLUSTER_ID" \
        --query 'CacheClusters[0].{Status:CacheClusterStatus,NodeType:CacheNodeType,Engine:Engine,Version:EngineVersion,Endpoint:CacheNodes[0].Endpoint.Address}' \
        --output json \
        --no-cli-pager)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to get cluster status${NC}"
        exit 1
    fi
    
    # Extract and display status
    CURRENT_STATUS=$(echo "$STATUS" | jq -r '.Status')
    NODE_TYPE=$(echo "$STATUS" | jq -r '.NodeType')
    ENGINE=$(echo "$STATUS" | jq -r '.Engine')
    VERSION=$(echo "$STATUS" | jq -r '.Version')
    ENDPOINT=$(echo "$STATUS" | jq -r '.Endpoint')
    
    echo -e "Cluster Status: ${YELLOW}$CURRENT_STATUS${NC}"
    echo "Node Type: $NODE_TYPE"
    echo "Engine: $ENGINE $VERSION"
    
    if [ "$ENDPOINT" != "null" ]; then
        echo -e "Endpoint: ${GREEN}$ENDPOINT${NC}"
    fi
    
    # Get snapshot status
    echo -e "\nSnapshot Status:"
    aws elasticache describe-snapshots \
        --cache-cluster-id "$CLUSTER_ID" \
        --query 'Snapshots[*].{Name:SnapshotName,Status:SnapshotStatus}' \
        --output table \
        --no-cli-pager
    
    # If cluster is available and no snapshots are creating, we're done
    if [ "$CURRENT_STATUS" = "available" ]; then
        CREATING_SNAPSHOTS=$(aws elasticache describe-snapshots \
            --cache-cluster-id "$CLUSTER_ID" \
            --query 'Snapshots[?SnapshotStatus==`creating`].SnapshotName' \
            --output text \
            --no-cli-pager)
        
        if [ -z "$CREATING_SNAPSHOTS" ]; then
            echo -e "\n${GREEN}All operations completed!${NC}"
            echo "Connect using: redis-cli -h $ENDPOINT"
            exit 0
        fi
    fi
    
    sleep 10
done 