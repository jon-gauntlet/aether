# Redis Alert Thresholds

## Current Alert Configuration
Last Updated: 2025-01-19

### Critical Alerts (Immediate Action Required)

1. Resource Utilization
   ```yaml
   CPUUtilization:
     threshold: 80%
     period: 300 seconds
     evaluation_periods: 2
     statistic: Average
     comparison: GreaterThanThreshold
     action: Immediate investigation required
   
   SwapUsage:
     threshold: 50MB
     period: 300 seconds
     evaluation_periods: 2
     statistic: Average
     comparison: GreaterThanThreshold
     action: Check memory pressure and application patterns
   
   DatabaseMemoryUsagePercentage:
     threshold: 80%
     period: 300 seconds
     evaluation_periods: 1
     statistic: Average
     comparison: GreaterThanThreshold
     action: Prepare for vertical scaling
   ```

2. Connectivity
   ```yaml
   CurrConnections:
     threshold: 1000
     period: 300 seconds
     evaluation_periods: 1
     statistic: Average
     comparison: GreaterThanThreshold
     action: Check for connection leaks
   
   NetworkBandwidthAllowanceExceeded:
     threshold: 1
     period: 300 seconds
     evaluation_periods: 1
     statistic: Sum
     comparison: GreaterThanThreshold
     action: Investigate network usage patterns
   ```

### Warning Alerts (Monitor and Plan)

1. Performance Degradation
   ```yaml
   CacheHitRate:
     threshold: 80%
     period: 1800 seconds
     evaluation_periods: 1
     statistic: Average
     comparison: LessThanThreshold
     action: Review caching strategy
   
   Evictions:
     threshold: 1000
     period: 300 seconds
     evaluation_periods: 1
     statistic: Sum
     comparison: GreaterThanThreshold
     action: Review memory allocation
   ```

2. Resource Warnings
   ```yaml
   CPUCreditBalance:
     threshold: 100
     period: 300 seconds
     evaluation_periods: 3
     statistic: Average
     comparison: LessThanThreshold
     action: Plan for scaling
   
   FreeableMemory:
     threshold: 100MB
     period: 300 seconds
     evaluation_periods: 3
     statistic: Average
     comparison: LessThanThreshold
     action: Review memory usage
   ```

### Infrastructure Alerts

1. Replication
   ```yaml
   ReplicationLag:
     threshold: 10 seconds
     period: 300 seconds
     evaluation_periods: 3
     statistic: Average
     comparison: GreaterThanThreshold
     action: Check network and load
   ```

2. Network
   ```yaml
   NetworkLatency:
     threshold: 1ms
     period: 300 seconds
     evaluation_periods: 3
     statistic: Average
     comparison: GreaterThanThreshold
     action: Investigate network issues
   ```

## Response Procedures

### Critical Alert Response
1. Immediate Actions:
   - Check CloudWatch metrics
   - Review application logs
   - Analyze recent changes
   - Notify on-call team

2. Resolution Steps:
   - Identify root cause
   - Apply immediate fixes
   - Document incident
   - Plan preventive measures

### Warning Alert Response
1. Investigation:
   - Monitor trend
   - Collect metrics
   - Review patterns
   - Plan mitigation

2. Prevention:
   - Capacity planning
   - Performance tuning
   - Resource optimization
   - Update documentation

## Alert Channels

### Primary Notification Path
1. CloudWatch Alarms
2. SNS Topic
3. On-call rotation
4. Incident management system

### Escalation Path
1. L1 Support (15 minutes)
2. L2 Support (30 minutes)
3. Infrastructure Team (1 hour)
4. Engineering Management

## Maintenance Windows

### Scheduled Maintenance
- Backup Window: 05:00-09:00 UTC
- Maintenance Window: As needed, coordinated with Backend team
- Parameter Updates: Requires planning and testing

### Emergency Maintenance
- Requires management approval
- Must be documented
- Post-mortem required
- Follow incident response procedure 