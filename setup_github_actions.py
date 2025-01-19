import boto3
import json
from botocore.exceptions import ClientError

def setup_github_actions():
    iam = boto3.client('iam')
    role_name = 'github-actions-role'
    policy_name = 'github-actions-policy'
    
    # Create OIDC provider if it doesn't exist
    try:
        print("Creating OIDC provider...")
        iam.create_open_id_connect_provider(
            Url='https://token.actions.githubusercontent.com',
            ClientIDList=['sts.amazonaws.com'],
            ThumbprintList=['6938fd4d98bab03faadb97b34396831e3780aea1']
        )
        print("OIDC provider created successfully")
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code')
        if error_code == 'EntityAlreadyExists':
            print("OIDC provider already exists")
        else:
            raise
    
    # Load the trust policy
    with open('github-actions-role-policy.json', 'r') as f:
        trust_policy = json.load(f)
        
    # Create or update role
    try:
        print("Creating IAM role...")
        role_response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Role for GitHub Actions to push to ECR and update ECS'
        )
        print("IAM role created successfully")
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code')
        if error_code == 'EntityAlreadyExists':
            print("IAM role already exists")
            print("Updating IAM role trust policy...")
            try:
                iam.update_assume_role_policy(
                    RoleName=role_name,
                    PolicyDocument=json.dumps(trust_policy)
                )
                print("IAM role trust policy updated successfully")
            except ClientError as e:
                error_message = e.response.get('Error', {}).get('Message', str(e))
                print(f"Error updating role trust policy: {error_message}")
                return False
        else:
            raise
    
    # Load the policy document
    with open('github-actions-policy.json', 'r') as f:
        policy = json.load(f)
        
    # List existing policies to find ours
    try:
        policies = iam.list_policies(Scope='Local')
        policy_arn = None
        for p in policies['Policies']:
            if p['PolicyName'] == policy_name:
                policy_arn = p['Arn']
                break
                
        if policy_arn:
            print("Updating existing IAM policy...")
            try:
                # Delete old versions first if we have too many
                versions = iam.list_policy_versions(PolicyArn=policy_arn)['Versions']
                if len(versions) >= 5:  # AWS limit is 5 versions
                    # Delete all non-default versions
                    for version in versions:
                        if not version['IsDefaultVersion']:
                            iam.delete_policy_version(
                                PolicyArn=policy_arn,
                                VersionId=version['VersionId']
                            )
                
                # Create new version
                iam.create_policy_version(
                    PolicyArn=policy_arn,
                    PolicyDocument=json.dumps(policy),
                    SetAsDefault=True
                )
                print("IAM policy updated successfully")
            except ClientError as e:
                error_message = e.response.get('Error', {}).get('Message', str(e))
                print(f"Error updating policy: {error_message}")
                print("Attempting to create new policy...")
                try:
                    # If update fails, try to create new policy
                    policy_response = iam.create_policy(
                        PolicyName=policy_name,
                        PolicyDocument=json.dumps(policy),
                        Description='Policy for GitHub Actions to push to ECR and update ECS'
                    )
                    policy_arn = policy_response['Policy']['Arn']
                    print("New IAM policy created successfully")
                except ClientError as e:
                    error_code = e.response.get('Error', {}).get('Code')
                    if error_code == 'EntityAlreadyExists':
                        print("Policy already exists but couldn't be updated")
                        return False
                    else:
                        raise
        else:
            print("Creating new IAM policy...")
            try:
                policy_response = iam.create_policy(
                    PolicyName=policy_name,
                    PolicyDocument=json.dumps(policy),
                    Description='Policy for GitHub Actions to push to ECR and update ECS'
                )
                policy_arn = policy_response['Policy']['Arn']
                print("IAM policy created successfully")
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code')
                if error_code == 'EntityAlreadyExists':
                    print("Policy already exists")
                    # Get the ARN of the existing policy
                    policies = iam.list_policies(Scope='Local')
                    for p in policies['Policies']:
                        if p['PolicyName'] == policy_name:
                            policy_arn = p['Arn']
                            break
                else:
                    raise
        
        if policy_arn:
            # List attached policies
            try:
                attached_policies = iam.list_attached_role_policies(
                    RoleName=role_name
                )
                
                # Attach the policy if not already attached
                is_attached = False
                for p in attached_policies['AttachedPolicies']:
                    if p['PolicyArn'] == policy_arn:
                        is_attached = True
                        break
                        
                if not is_attached:
                    print("Attaching policy to role...")
                    try:
                        iam.attach_role_policy(
                            RoleName=role_name,
                            PolicyArn=policy_arn
                        )
                        print("Policy attached to role successfully")
                    except ClientError as e:
                        error_message = e.response.get('Error', {}).get('Message', str(e))
                        print(f"Error attaching policy to role: {error_message}")
                        return False
                else:
                    print("Policy already attached to role")
                
                print("\nSetup complete!")
                print(f"Role ARN: arn:aws:iam::061051250133:role/{role_name}")
                print(f"Policy ARN: {policy_arn}")
                print("\nNext steps:")
                print("1. Add these secrets to your GitHub repository:")
                print(f"   AWS_ROLE_ARN: arn:aws:iam::061051250133:role/{role_name}")
                print("   AWS_REGION: us-west-2")
                print("2. Push code to the main branch or manually trigger the workflow")
                return True
            except ClientError as e:
                error_message = e.response.get('Error', {}).get('Message', str(e))
                print(f"Error listing attached policies: {error_message}")
                return False
        else:
            print("Error: Could not find or create policy")
            return False
    except ClientError as e:
        error_message = e.response.get('Error', {}).get('Message', str(e))
        print(f"Error listing policies: {error_message}")
        return False

def main():
    try:
        success = setup_github_actions()
        if not success:
            print("Setup failed")
            exit(1)
    except ClientError as e:
        error_message = e.response.get('Error', {}).get('Message', str(e))
        print(f"AWS Error: {error_message}")
        exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)

if __name__ == '__main__':
    main() 