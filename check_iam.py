import boto3
import json

def check_iam_roles():
    try:
        iam = boto3.client('iam', region_name='us-west-2')
        
        # Check execution role
        execution_role = iam.get_role(RoleName='ecsTaskExecutionRole')
        print("\nECS Task Execution Role:")
        print(json.dumps(execution_role, indent=2, default=str))
        
        # Get attached policies
        attached_policies = iam.list_attached_role_policies(RoleName='ecsTaskExecutionRole')
        print("\nAttached Policies:")
        print(json.dumps(attached_policies, indent=2, default=str))
        
        # Get inline policies
        inline_policies = iam.list_role_policies(RoleName='ecsTaskExecutionRole')
        print("\nInline Policies:")
        print(json.dumps(inline_policies, indent=2, default=str))
        
        for policy_name in inline_policies.get('PolicyNames', []):
            policy = iam.get_role_policy(RoleName='ecsTaskExecutionRole', PolicyName=policy_name)
            print(f"\nInline Policy {policy_name}:")
            print(json.dumps(policy, indent=2, default=str))
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    check_iam_roles() 