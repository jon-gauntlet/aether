import boto3
import json

def check_configuration():
    try:
        # Initialize clients
        ecs = boto3.client('ecs', region_name='us-west-2')
        ec2 = boto3.client('ec2', region_name='us-west-2')
        
        # Get task definition
        task_def = ecs.describe_task_definition(taskDefinition='aether-backend:1')
        print("\nTask Definition:")
        print(json.dumps(task_def, indent=2, default=str))
        
        # Get security group info
        sg = ec2.describe_security_groups(GroupIds=['sg-00a94e35e3de05c47'])
        print("\nSecurity Group:")
        print(json.dumps(sg, indent=2, default=str))
        
        # Get VPC endpoints
        vpc_endpoints = ec2.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-07a13455afa590268']}]
        )
        print("\nVPC Endpoints:")
        print(json.dumps(vpc_endpoints, indent=2, default=str))
        
    except Exception as e:
        print(f"Error: {str(e)}")

def check_security_groups():
    ec2 = boto3.client('ec2')
    ecs = boto3.client('ecs')
    
    # Get the VPC endpoint security group
    vpce_sg = ec2.describe_security_groups(
        Filters=[{'Name': 'group-name', 'Values': ['aether-ecs-sg']}]
    )
    
    # Get the ECS task security group (same in this case)
    task_sg = vpce_sg
    
    print("\nVPC Endpoint Security Group Rules:")
    print(json.dumps(vpce_sg, indent=2, default=str))
    
    print("\nECS Task Security Group Rules:")
    print(json.dumps(task_sg, indent=2, default=str))

def update_security_group():
    ec2 = boto3.client('ec2')
    
    # Get the security group
    sg_response = ec2.describe_security_groups(
        Filters=[{'Name': 'group-name', 'Values': ['aether-ecs-sg']}]
    )
    
    if not sg_response['SecurityGroups']:
        print("Security group not found")
        return
        
    sg_id = sg_response['SecurityGroups'][0]['GroupId']
    
    # Add self-referential HTTPS rule
    try:
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 443,
                    'ToPort': 443,
                    'UserIdGroupPairs': [{'GroupId': sg_id}]
                }
            ]
        )
        print(f"Successfully added HTTPS rule to security group {sg_id}")
    except Exception as e:
        if 'InvalidPermission.Duplicate' in str(e):
            print("HTTPS rule already exists")
        else:
            print(f"Error adding rule: {str(e)}")
            
    # Get updated rules
    updated_sg = ec2.describe_security_groups(GroupIds=[sg_id])
    print("\nUpdated Security Group Rules:")
    print(json.dumps(updated_sg, indent=2, default=str))

def force_deployment():
    ecs = boto3.client('ecs')
    
    try:
        response = ecs.update_service(
            cluster='aether-cluster',
            service='aether-service',
            forceNewDeployment=True
        )
        print("\nDeployment Response:")
        print(json.dumps(response, indent=2, default=str))
    except Exception as e:
        print(f"Error forcing deployment: {str(e)}")

def check_task_status():
    ecs = boto3.client('ecs')
    
    try:
        # List tasks
        tasks = ecs.list_tasks(
            cluster='aether-cluster',
            serviceName='aether-service'
        )
        print("\nTasks:")
        print(json.dumps(tasks, indent=2, default=str))
        
        if tasks['taskArns']:
            # Get task details
            task_details = ecs.describe_tasks(
                cluster='aether-cluster',
                tasks=tasks['taskArns']
            )
            print("\nTask Details:")
            print(json.dumps(task_details, indent=2, default=str))
            
            # Get stopped tasks
            stopped_tasks = ecs.list_tasks(
                cluster='aether-cluster',
                serviceName='aether-service',
                desiredStatus='STOPPED'
            )
            if stopped_tasks['taskArns']:
                stopped_task_details = ecs.describe_tasks(
                    cluster='aether-cluster',
                    tasks=stopped_tasks['taskArns']
                )
                print("\nStopped Task Details:")
                print(json.dumps(stopped_task_details, indent=2, default=str))
    except Exception as e:
        print(f"Error checking task status: {str(e)}")

def check_ecr():
    ecr = boto3.client('ecr')
    
    try:
        # List repositories
        repos = ecr.describe_repositories(repositoryNames=['aether-backend'])
        print("\nECR Repository:")
        print(json.dumps(repos, indent=2, default=str))
        
        # List images
        images = ecr.describe_images(repositoryName='aether-backend')
        print("\nECR Images:")
        print(json.dumps(images, indent=2, default=str))
    except Exception as e:
        print(f"Error checking ECR: {str(e)}")

if __name__ == "__main__":
    update_security_group()
    force_deployment()
    check_task_status()
    check_ecr() 