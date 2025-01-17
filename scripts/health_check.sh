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

echo "Performing health checks..."

# Check Redis cluster status
CLUSTER_STATUS=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id "$CLUSTER_ID" \
    --query 'CacheClusters[0].{Status:CacheClusterStatus,NodeType:CacheNodeType,Engine:Engine,Version:EngineVersion}' \
    --output json \
    --no-cli-pager)

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to get cluster status${NC}"
    exit 1
fi

echo "Cluster Status:"
echo "$CLUSTER_STATUS" | jq -r '.'

# Check VPC peering status
PEERING_ID=$(grep REDIS_VPC_PEERING_ID .env | tail -n1 | cut -d '=' -f2 | tr -d '\r')
if [ -n "$PEERING_ID" ]; then
    PEERING_STATUS=$(aws ec2 describe-vpc-peering-connections \
        --vpc-peering-connection-ids "$PEERING_ID" \
        --query 'VpcPeeringConnections[0].Status.Code' \
        --output text \
        --no-cli-pager)
    
    if [ "$PEERING_STATUS" = "active" ]; then
        echo -e "${GREEN}VPC Peering: Active${NC}"
    else
        echo -e "${RED}VPC Peering: $PEERING_STATUS${NC}"
    fi
fi

# Check CloudWatch metrics
echo "Checking CloudWatch metrics..."
START_TIME=$(date -u -d '5 minutes ago' '+%Y-%m-%dT%H:%M:%S')
END_TIME=$(date -u '+%Y-%m-%dT%H:%M:%S')

aws cloudwatch get-metric-statistics \
    --namespace AWS/ElastiCache \
    --metric-name CPUUtilization \
    --dimensions Name=CacheClusterId,Value="$CLUSTER_ID" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 300 \
    --statistics Average \
    --no-cli-pager

# Check backup status
echo "Checking backup status..."
aws elasticache describe-snapshots \
    --cache-cluster-id "$CLUSTER_ID" \
    --query 'Snapshots[*].{Name:SnapshotName,Status:SnapshotStatus,Time:NodeSnapshots[0].SnapshotCreateTime}' \
    --no-cli-pager

# Overall health status
echo -e "\nOverall Health Status:"
ISSUES=0

# Check cluster availability
if [[ $(echo "$CLUSTER_STATUS" | jq -r '.Status') != "available" ]]; then
    echo -e "${RED}❌ Cluster not available${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ Cluster available${NC}"
fi

# Check VPC peering
if [ "$PEERING_STATUS" != "active" ]; then
    echo -e "${RED}❌ VPC peering not active${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ VPC peering active${NC}"
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "\n${GREEN}All systems operational!${NC}"
    exit 0
else
    echo -e "\n${RED}Found $ISSUES issue(s)${NC}"
    exit 1
fi 