# Redis Connection Details

## Staging Environment

### Endpoints
- Primary: `master.aers3l8mlzy85ti.8jeuns.usw2.cache.amazonaws.com:6379`
- Reader: `replica.aers3l8mlzy85ti.8jeuns.usw2.cache.amazonaws.com:6379`

### Configuration
- Instance Type: cache.t4g.micro
- Engine Version: redis 7.x
- Port: 6379
- Parameter Group: aether-cache-j0afatglnzdd
- Security Group: sg-015b3cf0a6442655a

### Security
- Encryption in Transit: Enabled
- Encryption at Rest: Enabled
- VPC Access Only: Yes
- Auth Token: Not enabled (VPC security only)

### Performance Settings
- maxmemory-policy: volatile-lru
- notify-keyspace-events: AKE
- Performance Target: 193K+ queries/sec
- Memory Usage Target: <80%
- CPU Utilization Target: <80%
- Cache Hit Rate Target: >80%

### Monitoring
- CloudWatch Metrics: Enabled
- Alarms:
  - CPU Utilization > 80% (2 periods of 5 min)
  - Swap Usage > 50MB (2 periods of 5 min)
- Performance Metrics: Available in CloudWatch namespace AWS/ElastiCache
- Logs: Available in CloudWatch Logs

### Connection Example (Python)
```python
import redis

redis_client = redis.Redis(
    host='master.aers3l8mlzy85ti.8jeuns.usw2.cache.amazonaws.com',
    port=6379,
    ssl=True,
    decode_responses=True
)

# Test connection
redis_client.ping()  # Should return True
```

### Connection Example (Node.js)
```javascript
const Redis = require('ioredis');

const redis = new Redis({
    host: 'master.aers3l8mlzy85ti.8jeuns.usw2.cache.amazonaws.com',
    port: 6379,
    tls: {},
    retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Test connection
redis.ping().then(console.log);  // Should print "PONG"
```

### Health Check
To verify the Redis cluster is healthy:
```bash
aws elasticache describe-replication-groups \
    --replication-group-id aers3l8mlzy85ti \
    --query 'ReplicationGroups[0].Status'
```
Should return: "available"

### Backup and Recovery
- Automatic Backups: Enabled
- Backup Window: 05:00-09:00 UTC
- Backup Retention: 1 day
- Recovery: Use AWS Console or AWS CLI to restore from backup

### Support
For issues or questions:
1. Check CloudWatch metrics and alarms
2. Verify VPC and security group access
3. Test connectivity from application subnet
4. Contact infrastructure team if issues persist 