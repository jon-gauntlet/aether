import boto3
import base64

def get_ecr_login():
    try:
        ecr = boto3.client('ecr', region_name='us-west-2')
        token = ecr.get_authorization_token()
        username, password = base64.b64decode(token['authorizationData'][0]['authorizationToken']).decode().split(':')
        registry = token['authorizationData'][0]['proxyEndpoint']
        
        print(f"docker login -u {username} -p {password} {registry}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    get_ecr_login() 