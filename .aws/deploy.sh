#!/bin/bash
set -e

# Default values
ENVIRONMENT="production"
STACK_NAME="aether-backend"
REGION="us-west-2"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment|-e)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --stack-name|-s)
      STACK_NAME="$2"
      shift 2
      ;;
    --region|-r)
      REGION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
  echo "Error: Environment must be either 'production' or 'staging'"
  exit 1
fi

# Get existing resource IDs
echo "Gathering existing resource information..."

# Get VPC and Subnet
VPC_ID=$(aws ec2 describe-vpcs --no-paginate --query 'Vpcs[0].VpcId' --output text --region $REGION)
SUBNET_ID=$(aws ec2 describe-subnets --no-paginate --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text --region $REGION)

# Get existing ECS resources
CLUSTER_NAME="aether-cluster"
SERVICE_NAME="aether-service"
CLUSTER_ARN=$(aws ecs describe-clusters --no-paginate --clusters $CLUSTER_NAME --query 'clusters[0].clusterArn' --output text --region $REGION)
SERVICE_ARN=$(aws ecs describe-services --no-paginate --cluster $CLUSTER_NAME --services $SERVICE_NAME --query 'services[0].serviceArn' --output text --region $REGION)

# Get existing ECR repository
REPO_NAME="aether-backend"
REPO_ARN=$(aws ecr describe-repositories --no-paginate --repository-names $REPO_NAME --query 'repositories[0].repositoryArn' --output text --region $REGION)

# Get existing IAM roles
TASK_ROLE_ARN=$(aws iam get-role --no-paginate --role-name ecsTaskRole --query 'Role.Arn' --output text)
EXECUTION_ROLE_ARN=$(aws iam get-role --no-paginate --role-name ecsTaskExecutionRole --query 'Role.Arn' --output text)

# Get existing security group
SG_ID=$(aws ec2 describe-security-groups --no-paginate --filters "Name=group-name,Values=aether-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text --region $REGION)

# Create import file
cat > "$SCRIPT_DIR/import.json" << EOF
[
  {
    "ResourceType": "AWS::ECS::Cluster",
    "LogicalResourceId": "ECSCluster",
    "ResourceIdentifier": {
      "ClusterName": "$CLUSTER_NAME"
    }
  },
  {
    "ResourceType": "AWS::ECS::Service",
    "LogicalResourceId": "ECSService",
    "ResourceIdentifier": {
      "ServiceArn": "$SERVICE_ARN",
      "Cluster": "$CLUSTER_NAME"
    }
  },
  {
    "ResourceType": "AWS::ECR::Repository",
    "LogicalResourceId": "AetherRepository",
    "ResourceIdentifier": {
      "RepositoryName": "aether-backend"
    }
  },
  {
    "ResourceType": "AWS::IAM::Role",
    "LogicalResourceId": "TaskRole",
    "ResourceIdentifier": {
      "RoleName": "ecsTaskRole"
    }
  },
  {
    "ResourceType": "AWS::IAM::Role",
    "LogicalResourceId": "TaskExecutionRole",
    "ResourceIdentifier": {
      "RoleName": "ecsTaskExecutionRole"
    }
  },
  {
    "ResourceType": "AWS::EC2::SecurityGroup",
    "LogicalResourceId": "ContainerSecurityGroup",
    "ResourceIdentifier": {
      "Id": "$SG_ID"
    }
  },
  {
    "ResourceType": "AWS::Logs::LogGroup",
    "LogicalResourceId": "LogGroup",
    "ResourceIdentifier": {
      "LogGroupName": "/ecs/aether-backend"
    }
  },
  {
    "ResourceType": "AWS::ECS::TaskDefinition",
    "LogicalResourceId": "TaskDefinition",
    "ResourceIdentifier": {
      "TaskDefinitionArn": "$(aws ecs describe-services --no-paginate --cluster $CLUSTER_NAME --services $SERVICE_NAME --query 'services[0].taskDefinition' --output text)"
    }
  },
  {
    "ResourceType": "AWS::ApplicationAutoScaling::ScalableTarget",
    "LogicalResourceId": "ScalableTarget",
    "ResourceIdentifier": {
      "ServiceNamespace": "ecs",
      "ResourceId": "service/$CLUSTER_NAME/$SERVICE_NAME",
      "ScalableDimension": "ecs:service:DesiredCount"
    }
  },
  {
    "ResourceType": "AWS::ApplicationAutoScaling::ScalingPolicy",
    "LogicalResourceId": "ScalingPolicy",
    "ResourceIdentifier": {
      "Arn": "$(aws application-autoscaling describe-scaling-policies --no-paginate --service-namespace ecs --resource-id service/$CLUSTER_NAME/$SERVICE_NAME --query 'ScalingPolicies[0].PolicyARN' --output text)",
      "ScalableDimension": "ecs:service:DesiredCount"
    }
  }
]
EOF

echo "Deploying Aether Backend infrastructure..."
echo "Stack Name: $STACK_NAME-$ENVIRONMENT"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "VPC ID: $VPC_ID"
echo "Subnet ID: $SUBNET_ID"

# Check if stack exists
if ! aws cloudformation describe-stacks --no-paginate --stack-name "$STACK_NAME-$ENVIRONMENT" --region $REGION &>/dev/null; then
  echo "Creating new stack and importing existing resources..."
  
  # Create change set with resource imports
  aws cloudformation create-change-set \
    --no-paginate \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --change-set-name "ImportChangeSet" \
    --change-set-type IMPORT \
    --resources-to-import "$(cat "$SCRIPT_DIR/import.json")" \
    --template-body "file://$SCRIPT_DIR/cloudformation.yml" \
    --parameters \
      ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
      ParameterKey=VpcId,ParameterValue=$VPC_ID \
      ParameterKey=SubnetId,ParameterValue=$SUBNET_ID \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

  # Wait for change set creation
  aws cloudformation wait change-set-create-complete \
    --no-paginate \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --change-set-name "ImportChangeSet" \
    --region $REGION

  # Execute change set
  aws cloudformation execute-change-set \
    --no-paginate \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --change-set-name "ImportChangeSet" \
    --region $REGION

  # Wait for stack creation
  aws cloudformation wait stack-create-complete \
    --no-paginate \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --region $REGION
else
  echo "Updating existing stack..."
  # Update existing stack
  aws cloudformation deploy \
    --no-paginate \
    --template-file "$SCRIPT_DIR/cloudformation.yml" \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --parameter-overrides \
      Environment=$ENVIRONMENT \
      VpcId=$VPC_ID \
      SubnetId=$SUBNET_ID \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION
fi

# Clean up import file
rm -f "$SCRIPT_DIR/import.json"

# Get stack outputs
echo -e "\nStack Outputs:"
aws cloudformation describe-stacks \
  --no-paginate \
  --stack-name "$STACK_NAME-$ENVIRONMENT" \
  --query 'Stacks[0].Outputs' \
  --output table \
  --region $REGION 