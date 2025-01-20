# RAG System Deployment Guide



## Deployment Overview

### System Requirements
- CPU: 4+ cores
- RAM: 8GB+ (16GB recommended)
- Storage: 50GB+ SSD
- Network: 1Gbps+
- OS: Ubuntu 22.04 LTS

### Performance Targets
- Document Processing: 175K+ docs/sec
- Query Processing: 190K+ queries/sec
- Memory Usage: <85%
- Error Rate: <1%

## Deployment Steps

### 1. Infrastructure Setup

#### AWS Environment
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24

# Create security groups
aws ec2 create-security-group --group-name rag-system --description "RAG System"
```

#### ElastiCache Setup
```bash
# Create subnet group
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name rag-subnet-group \
    --subnet-ids subnet-xxx subnet-yyy

# Create Redis cluster
aws elasticache create-replication-group \
    --replication-group-id rag-redis \
    --engine redis \
    --cache-node-type cache.r6g.xlarge \
    --num-cache-clusters 2
```

#### EC2 Instance
```bash
# Launch instance
aws ec2 run-instances \
    --image-id ami-ubuntu-22.04 \
    --instance-type c5.2xlarge \
    --key-name your-key \
    --security-group-ids sg-xxx
```

### 2. System Configuration

#### OS Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.12 python3.12-venv build-essential

# Configure system limits
sudo tee /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
EOF
```

#### Python Environment
```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Clone repository
git clone https://github.com/your-org/rag-aether.git
cd rag-aether

# Install dependencies
poetry install --no-dev
```

#### Environment Configuration
```bash
# Create production env file
sudo mkdir /etc/rag-aether
sudo tee /etc/rag-aether/prod.env << EOF
OPENAI_API_KEY=your_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
REDIS_HOST=your.redis.cache.amazonaws.com
REDIS_PORT=6379
REDIS_SSL=true
EOF
```

### 3. Application Deployment

#### Systemd Service
```ini
# /etc/systemd/system/rag-system.service
[Unit]
Description=RAG System Service
After=network.target

[Service]
User=rag-user
Group=rag-user
WorkingDirectory=/opt/rag-aether
Environment=PYTHONPATH=/opt/rag-aether
EnvironmentFile=/etc/rag-aether/prod.env
ExecStart=/usr/local/bin/poetry run uvicorn rag_aether.api:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

#### Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable rag-system
sudo systemctl start rag-system
```

### 4. Monitoring Setup

#### Prometheus Configuration
```yaml
# /etc/prometheus/prometheus.yml
scrape_configs:
  - job_name: 'rag-system'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:8000']
```

#### Grafana Dashboard
```bash
# Import dashboard
curl -X POST http://localhost:3000/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @config/monitoring/dashboard.json
```

### 5. Security Configuration

#### SSL/TLS Setup
```bash
# Generate certificate
sudo certbot certonly --standalone -d rag.yourdomain.com

# Configure Nginx
sudo tee /etc/nginx/sites-available/rag-system << EOF
server {
    listen 443 ssl;
    server_name rag.yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/rag.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rag.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
```

#### Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 6. Backup Configuration

#### Automated Backups
```bash
# Create backup script
sudo tee /opt/rag-aether/backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d)
# Redis backup
redis-cli save
cp /var/lib/redis/dump.rdb /backup/redis_\$DATE.rdb

# Supabase backup
supabase db dump -f /backup/supabase_\$DATE.sql
EOF

# Add to crontab
echo "0 2 * * * /opt/rag-aether/backup.sh" | sudo tee -a /etc/crontab
```

### 7. Recovery Procedures

#### Service Recovery
```bash
# Restart service
sudo systemctl restart rag-system

# Check logs
sudo journalctl -u rag-system -f
```

#### Data Recovery
```bash
# Restore Redis
sudo systemctl stop redis
sudo cp /backup/redis_20240321.rdb /var/lib/redis/dump.rdb
sudo systemctl start redis

# Restore Supabase
psql -f /backup/supabase_20240321.sql
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://rag.yourdomain.com/health
```

### 2. Performance Test
```bash
# Run benchmarks
poetry run pytest tests/performance/test_speed.py --benchmark-only

# Check metrics
curl https://rag.yourdomain.com/metrics
```

### 3. Security Scan
```bash
# Run security checks
poetry run safety check
sudo nmap -sV -p- rag.yourdomain.com
```

## Maintenance Procedures

### 1. Updates
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update application
cd /opt/rag-aether
git pull
poetry install --no-dev
sudo systemctl restart rag-system
```

### 2. Log Rotation
```bash
# Configure logrotate
sudo tee /etc/logrotate.d/rag-system << EOF
/var/log/rag-system/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 rag-user rag-user
}
EOF
```

### 3. Monitoring
```bash
# Check system status
sudo systemctl status rag-system

# View logs
sudo tail -f /var/log/rag-system/app.log

# Check metrics
curl https://rag.yourdomain.com/metrics
``` 