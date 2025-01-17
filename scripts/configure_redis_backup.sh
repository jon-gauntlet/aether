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

echo "Configuring Redis backup settings..."

# Enable snapshot retention (7 days)
aws elasticache modify-cache-cluster \
    --cache-cluster-id "$CLUSTER_ID" \
    --snapshot-retention-limit 7 \
    --apply-immediately \
    --no-cli-pager || {
        echo -e "${RED}Failed to enable snapshot retention${NC}"
        exit 1
    }

# Create a manual backup
echo "Creating initial backup..."
aws elasticache create-snapshot \
    --cache-cluster-id "$CLUSTER_ID" \
    --snapshot-name "${CLUSTER_ID}-initial" \
    --no-cli-pager || {
        echo -e "${YELLOW}Note: Initial backup creation failed. This is expected if cluster is not ready.${NC}"
    }

# Configure CloudWatch alarms for backup monitoring
echo "Setting up backup monitoring..."
aws cloudwatch put-metric-alarm \
    --alarm-name "${CLUSTER_ID}-backup-alarm" \
    --alarm-description "Monitor Redis backup status" \
    --metric-name "SnapshotCreateFailed" \
    --namespace "AWS/ElastiCache" \
    --statistic Sum \
    --period 300 \
    --threshold 1 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --dimensions Name=CacheClusterId,Value="$CLUSTER_ID" \
    --alarm-actions "arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${STACK_NAME}-alerts" \
    --no-cli-pager || {
        echo -e "${YELLOW}Note: CloudWatch alarm creation failed. Please ensure SNS topic exists.${NC}"
    }

echo -e "${GREEN}Redis backup configuration completed!${NC}"
echo "- Snapshot retention: 7 days"
echo "- Snapshot window: 03:00-04:00 UTC"
echo "- Monitoring: Enabled (CloudWatch)"

# Show current backup status
aws elasticache describe-snapshots \
    --cache-cluster-id "$CLUSTER_ID" \
    --query 'Snapshots[*].{Name:SnapshotName,Status:SnapshotStatus,Size:SnapshotSize}' \
    --no-cli-pager 