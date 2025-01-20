import boto3
import json
from datetime import datetime, timedelta

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, timedelta)):
            return str(obj)
        return super().default(obj)

def verify_redis():
    print("Verifying Redis setup...")
    
    # Verify CloudFormation template
    print("\n1. Validating CloudFormation template...")
    with open('.aws/redis-stack.yml', 'r') as f:
        template = f.read()
    cfn = boto3.client('cloudformation')
    cfn.validate_template(TemplateBody=template)
    print("✅ Template validation successful")
    
    # Check ElastiCache status
    print("\n2. Checking ElastiCache status...")
    elasticache = boto3.client('elasticache')
    clusters = elasticache.describe_cache_clusters()
    print("Cache Clusters:")
    print(json.dumps(clusters, indent=2, cls=DateTimeEncoder))
    
    # Check replication group status
    print("\n3. Checking replication group status...")
    replication_groups = elasticache.describe_replication_groups(
        ReplicationGroupId='aers3l8mlzy85ti'
    )
    print("Replication Group:")
    print(json.dumps(replication_groups, indent=2, cls=DateTimeEncoder))
    
    # Monitor metrics
    print("\n4. Checking CloudWatch metrics...")
    cloudwatch = boto3.client('cloudwatch')
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=30)
    
    metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/ElastiCache',
        MetricName='CPUUtilization',
        Dimensions=[
            {
                'Name': 'CacheClusterId',
                'Value': 'aers3l8mlzy85ti-001'
            }
        ],
        StartTime=start_time,
        EndTime=end_time,
        Period=300,
        Statistics=['Average']
    )
    print("\nCPU Utilization Metrics:")
    print(json.dumps(metrics, indent=2, cls=DateTimeEncoder))
    
    # Check parameter group
    print("\n5. Checking parameter group configuration...")
    parameters = elasticache.describe_cache_parameters(
        CacheParameterGroupName='aether-cache-j0afatglnzdd'
    )
    print("\nParameter Group Configuration:")
    important_params = [p for p in parameters['Parameters'] 
                       if p['ParameterName'] in ['maxmemory-policy', 'notify-keyspace-events']]
    print(json.dumps(important_params, indent=2, cls=DateTimeEncoder))

if __name__ == '__main__':
    verify_redis() 