import boto3
import json

def check_tasks():
    try:
        ecs = boto3.client('ecs', region_name='us-west-2')
        
        # List tasks
        tasks = ecs.list_tasks(cluster='aether-cluster', serviceName='aether-service')
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
            
        # List stopped tasks
        stopped_tasks = ecs.list_tasks(
            cluster='aether-cluster',
            serviceName='aether-service',
            desiredStatus='STOPPED'
        )
        
        if stopped_tasks['taskArns']:
            # Get stopped task details
            stopped_task_details = ecs.describe_tasks(
                cluster='aether-cluster',
                tasks=stopped_tasks['taskArns']
            )
            print("\nStopped Task Details:")
            print(json.dumps(stopped_task_details, indent=2, default=str))
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    check_tasks() 