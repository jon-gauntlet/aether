# Operations Runbook

Christ is King! ☦

## Quick Reference

### Health Checks
```bash
# Check all services
python verify_production.py

# Check resource usage
python analyze_costs.py

# Check Redis
redis-cli ping
redis-cli info | grep version

# Check Supabase
supabase status | cat
```

### Common Operations

#### Backup and Restore
```bash
# Backup Redis
redis-cli SAVE

# Backup Supabase
supabase db dump -f backup.sql

# Restore Redis
sudo systemctl stop redis
sudo cp /path/to/dump.rdb /var/lib/redis/dump.rdb
sudo systemctl start redis

# Restore Supabase
psql -f backup.sql
```

#### Security Operations
```bash
# Rotate API Keys
supabase secrets rotate | cat

# Check SSL Certificates
openssl x509 -in /path/to/cert.pem -text -noout

# Test Rate Limiting
for i in {1..12}; do 
  curl -I http://127.0.0.1:54321/storage/v1/bucket;
done
```

#### Monitoring Operations
```bash
# Check Prometheus Metrics
curl http://localhost:9090/api/v1/query?query=up

# Check Grafana
curl http://localhost:3000/api/health

# View Recent Alerts
curl http://localhost:9093/api/v2/alerts
```

### Troubleshooting Guide

#### Redis Issues
1. Connection Refused
   ```bash
   # Check Redis service
   sudo systemctl status redis
   
   # Check logs
   sudo journalctl -u redis -n 100
   
   # Verify config
   redis-cli CONFIG GET *
   ```

2. High Memory Usage
   ```bash
   # Check memory stats
   redis-cli info memory
   
   # Clear cache if needed
   redis-cli FLUSHDB
   ```

#### Supabase Issues
1. Storage Access Problems
   ```bash
   # Check bucket status
   supabase storage list | cat
   
   # Verify policies
   supabase db psql -c "SELECT * FROM storage.buckets;"
   ```

2. Database Connection Issues
   ```bash
   # Check database status
   supabase db ping
   
   # View recent logs
   supabase logs | cat
   ```

#### Monitoring Issues
1. Missing Metrics
   ```bash
   # Check Prometheus targets
   curl http://localhost:9090/api/v1/targets
   
   # Verify scrape config
   cat prometheus/prometheus.yml
   ```

2. Alert Manager Problems
   ```bash
   # Check alert manager status
   curl http://localhost:9093/-/healthy
   
   # View alert config
   cat alertmanager/alertmanager.yml
   ```

### Performance Optimization

#### Redis Optimization
```bash
# Check current config
redis-cli CONFIG GET maxmemory*
redis-cli CONFIG GET *policy*

# Optimize memory
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory "2gb"
```

#### System Optimization
```bash
# Check system resources
top -b -n 1
free -m
df -h

# Clear system cache
sudo sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Maintenance Procedures

#### Regular Maintenance
1. Daily Tasks
   - Run health checks
   - Review error logs
   - Check backup status
   - Monitor resource usage

2. Weekly Tasks
   - Rotate logs
   - Clean old backups
   - Update documentation
   - Review metrics

3. Monthly Tasks
   - Security audits
   - Performance review
   - Capacity planning
   - Update runbooks

#### Emergency Procedures
1. Service Outage
   ```bash
   # Quick service restart
   sudo systemctl restart redis supabase
   
   # Check logs
   sudo journalctl -xe
   ```

2. Data Recovery
   ```bash
   # Restore from latest backup
   ./scripts/restore_backup.sh
   
   # Verify data integrity
   python verify_production.py
   ```

### Monitoring and Alerts

#### Alert Levels
1. Critical (P1)
   - Service down
   - Data loss
   - Security breach
   - Response: Immediate action required

2. Warning (P2)
   - High resource usage
   - Slow response times
   - Failed backups
   - Response: Investigate within 4 hours

3. Info (P3)
   - Performance degradation
   - Minor issues
   - Response: Review during business hours

#### Alert Response
1. Acknowledge alert
2. Check runbook for specific issue
3. Follow troubleshooting steps
4. Document actions taken
5. Update runbook if needed

### Security Procedures

#### Access Management
```bash
# List current access
supabase auth list

# Add new access
supabase auth add user@example.com

# Remove access
supabase auth remove user@example.com
```

#### Security Audits
```bash
# Check security settings
python verify_production.py

# Review access logs
supabase logs auth | cat

# Check SSL configuration
openssl s_client -connect localhost:54321 -tls1_2
```

### Contact Information

#### On-Call Support
1. Primary: [Contact Info]
2. Secondary: [Contact Info]
3. Management: [Contact Info]

#### External Support
1. Supabase Support: [Link]
2. Redis Support: [Link]
3. AWS Support: [Link]

Remember: Document all actions taken in PROGRESS.md 