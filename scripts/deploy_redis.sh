#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check required environment variables
if [ -z "$AWS_REGION" ] || [ -z "$STACK_NAME" ] || [ -z "$REDIS_VPC_ID" ]; then
    echo -e "${RED}Error: Required environment variables not set.${NC}"
    echo "Please set: AWS_REGION, STACK_NAME, REDIS_VPC_ID"
    exit 1
fi

echo "Deploying Redis infrastructure..."

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file infrastructure/redis-enterprise.yml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        PeerVpcId="$REDIS_VPC_ID" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --region "$AWS_REGION" || {
        echo -e "${RED}Infrastructure deployment failed${NC}"
        echo "Stack events:"
        aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --no-cli-pager
        exit 1
    }

# Get outputs
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue}' \
    --output json \
    --region "$AWS_REGION")

# Extract values
SG_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.Key=="SecurityGroupId") | .Value')
VPC_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.Key=="VpcId") | .Value')
SUBNET1_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.Key=="Subnet1Id") | .Value')
SUBNET2_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.Key=="Subnet2Id") | .Value')
PEERING_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.Key=="VpcPeeringId") | .Value')

# Update environment file
echo "Updating environment file..."
{
    echo "REDIS_SECURITY_GROUP_ID=$SG_ID"
    echo "REDIS_VPC_ID=$VPC_ID"
    echo "REDIS_SUBNET1_ID=$SUBNET1_ID"
    echo "REDIS_SUBNET2_ID=$SUBNET2_ID"
    echo "REDIS_VPC_PEERING_ID=$PEERING_ID"
} >> .env

echo -e "${GREEN}Redis infrastructure deployed successfully!${NC}"
echo "Security Group ID: $SG_ID"
echo "VPC ID: $VPC_ID"
echo "Subnet 1 ID: $SUBNET1_ID"
echo "Subnet 2 ID: $SUBNET2_ID"
echo "VPC Peering ID: $PEERING_ID"

# Create ElastiCache subnet group
echo "Creating ElastiCache subnet group..."
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name "${STACK_NAME}-subnets" \
    --cache-subnet-group-description "Subnet group for Redis" \
    --subnet-ids "$SUBNET1_ID" "$SUBNET2_ID" \
    --no-cli-pager || {
        echo -e "${RED}Failed to create subnet group${NC}"
        exit 1
    }

# Create ElastiCache cluster
echo "Creating Redis cluster..."
aws elasticache create-cache-cluster \
    --cache-cluster-id "${STACK_NAME}-redis" \
    --engine redis \
    --cache-node-type cache.t3.micro \
    --num-cache-nodes 1 \
    --cache-subnet-group-name "${STACK_NAME}-subnets" \
    --security-group-ids "$SG_ID" \
    --no-cli-pager || {
        echo -e "${RED}Failed to create Redis cluster${NC}"
        exit 1
    }

echo -e "${GREEN}Redis cluster creation initiated. It may take a few minutes to complete.${NC}"
echo "Monitor status with: aws elasticache describe-cache-clusters --cache-cluster-id ${STACK_NAME}-redis --no-cli-pager" 