#!/bin/bash
set -e

# Check AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Variables
REGION="us-west-2"
CLUSTER_NAME="aether-cluster"
SERVICE_NAME="aether-service"
REPO_NAME="aether-backend"

# Create ECS cluster
echo "Creating/updating ECS cluster..."
aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    --region $REGION || true

# Create ECR repository
echo "Creating/checking ECR repository..."
aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION || \
aws ecr create-repository \
    --repository-name $REPO_NAME \
    --image-scanning-configuration scanOnPush=true \
    --region $REGION

# Create CloudWatch log group
echo "Creating/checking CloudWatch log group..."
aws logs describe-log-groups --log-group-name-prefix /ecs/aether-backend --region $REGION || \
aws logs create-log-group \
    --log-group-name /ecs/aether-backend \
    --region $REGION

# Register task definition
echo "Registering task definition..."
aws ecs register-task-definition \
    --cli-input-json file://.aws/task-definition.json \
    --region $REGION

# Create or update ECS service
echo "Creating/updating ECS service..."
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION | grep -q "MISSING"; then
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition aether-backend \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-02ecdd55a635d60a1],securityGroups=[sg-00a94e35e3de05c47],assignPublicIp=ENABLED}" \
        --region $REGION
else
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition aether-backend \
        --region $REGION
fi

# Set up auto-scaling
echo "Setting up auto-scaling..."
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/$CLUSTER_NAME/$SERVICE_NAME \
    --min-capacity 1 \
    --max-capacity 10 \
    --region $REGION || true

aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/$CLUSTER_NAME/$SERVICE_NAME \
    --policy-name cpu-tracking-scaling-policy \
    --policy-type TargetTrackingScaling \
    --region $REGION \
    --target-tracking-scaling-policy-configuration file://.aws/auto-scaling.json || true

echo "Setup complete!" 