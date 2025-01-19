# Aether Deployment Guide

## Normal Deployment
1. Push to main branch or trigger workflow manually
2. GitHub Actions workflow will:
   - Run system checks
   - Validate AWS access
   - Build and scan container
   - Push to ECR
   - Deploy to ECS with health checks

## Monitoring
- CloudWatch alarm "aether-service-health" monitors task health
- Container health check endpoint: `http://localhost:8000/health`
- Health check interval: 30s, timeout: 5s, retries: 3

## Rollback Procedures

### Automatic Rollback
The deployment workflow includes automatic rollback if:
- Service fails to stabilize
- Health checks fail
- Task definition update fails

### Manual Rollback
If needed, rollback manually:
```bash
# Get previous task definition
aws ecs describe-services \
  --cluster aether-cluster \
  --services aether-service \
  --query 'services[0].taskDefinition'

# Roll back to previous version
aws ecs update-service \
  --cluster aether-cluster \
  --service aether-service \
  --task-definition PREVIOUS_TASK_DEF_ARN
```

## Troubleshooting
1. Check service events:
   ```bash
   aws ecs describe-services \
     --cluster aether-cluster \
     --services aether-service \
     --query 'services[0].events'
   ```
2. View container logs in CloudWatch
3. Check task definition health check results 