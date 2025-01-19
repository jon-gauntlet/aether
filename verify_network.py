import boto3
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def verify_network():
    print("Verifying network setup...")
    ec2 = boto3.client('ec2')
    
    # Verify VPC setup
    print("\n1. Checking VPCs...")
    vpcs = ec2.describe_vpcs()
    print("VPCs:")
    print(json.dumps(vpcs, indent=2, cls=DateTimeEncoder))
    
    print("\n2. Checking subnets...")
    subnets = ec2.describe_subnets()
    print("Subnets:")
    print(json.dumps(subnets, indent=2, cls=DateTimeEncoder))
    
    print("\n3. Checking security groups...")
    security_groups = ec2.describe_security_groups()
    print("Security Groups:")
    print(json.dumps(security_groups, indent=2, cls=DateTimeEncoder))
    
    # Test connectivity
    print("\n4. Checking network interfaces...")
    interfaces = ec2.describe_network_interfaces()
    print("Network Interfaces:")
    print(json.dumps(interfaces, indent=2, cls=DateTimeEncoder))

if __name__ == '__main__':
    verify_network() 