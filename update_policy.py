import boto3
import json

def update_role_policy():
    try:
        iam = boto3.client('iam', region_name='us-west-2')
        
        # Read policy document
        with open('execution-role-policy.json', 'r') as f:
            policy_doc = json.load(f)
        
        # Update role policy
        response = iam.put_role_policy(
            RoleName='ecsTaskExecutionRole',
            PolicyName='ecsTaskExecutionPolicy',
            PolicyDocument=json.dumps(policy_doc)
        )
        print("Successfully updated role policy")
        print(json.dumps(response, indent=2, default=str))
        
        # Force new deployment
        ecs = boto3.client('ecs', region_name='us-west-2')
        response = ecs.update_service(
            cluster='aether-cluster',
            service='aether-service',
            forceNewDeployment=True
        )
        print("\nForced new deployment")
        print(json.dumps(response, indent=2, default=str))
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    update_role_policy() 