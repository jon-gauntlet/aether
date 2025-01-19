import boto3
import json

def setup_github_actions():
    try:
        iam = boto3.client('iam')
        
        # Create the role
        with open('github-actions-role-policy.json', 'r') as f:
            trust_policy = json.load(f)
            
        print("Creating IAM role...")
        role_response = iam.create_role(
            RoleName='github-actions-role',
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Role for GitHub Actions to push to ECR and update ECS'
        )
        
        # Create the policy
        with open('github-actions-policy.json', 'r') as f:
            policy = json.load(f)
            
        print("Creating IAM policy...")
        policy_response = iam.create_policy(
            PolicyName='github-actions-policy',
            PolicyDocument=json.dumps(policy),
            Description='Policy for GitHub Actions to push to ECR and update ECS'
        )
        
        # Attach the policy to the role
        print("Attaching policy to role...")
        iam.attach_role_policy(
            RoleName='github-actions-role',
            PolicyArn=policy_response['Policy']['Arn']
        )
        
        print("Setup complete!")
        print(f"Role ARN: {role_response['Role']['Arn']}")
        print(f"Policy ARN: {policy_response['Policy']['Arn']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    setup_github_actions() 