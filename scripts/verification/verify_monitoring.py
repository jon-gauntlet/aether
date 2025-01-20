import boto3
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return str(obj)
        return super().default(obj)

def verify_monitoring():
    print("Verifying monitoring setup...")
    cloudwatch = boto3.client('cloudwatch')
    logs = boto3.client('logs')
    
    # Check CloudWatch metrics
    print("\n1. Checking CloudWatch metrics...")
    metrics = cloudwatch.list_metrics(Namespace='AWS/ElastiCache')
    print("Metrics:")
    print(json.dumps(metrics, indent=2, cls=DateTimeEncoder))
    
    print("\n2. Checking CloudWatch alarms...")
    alarms = cloudwatch.describe_alarms(AlarmNamePrefix='aether-redis')
    print("Alarms:")
    print(json.dumps(alarms, indent=2, cls=DateTimeEncoder))
    
    # Verify logs
    print("\n3. Checking log groups...")
    log_groups = logs.describe_log_groups(logGroupNamePrefix='/aws/elasticache')
    print("Log Groups:")
    print(json.dumps(log_groups, indent=2, cls=DateTimeEncoder))

if __name__ == '__main__':
    verify_monitoring() 