# RAG System Setup Guide



## Prerequisites
- Python 3.12+
- Poetry
- Redis
- Supabase (local or hosted)
- OpenAI API key

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/rag-aether.git
cd rag-aether
```

### 2. Environment Setup
```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Create .env file
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# OpenAI
OPENAI_API_KEY=your_api_key

# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your_supabase_key

# Redis
REDIS_URL=redis://localhost:6379/0
```

### 3. Local Supabase Setup
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Verify health
curl http://127.0.0.1:54321/auth/v1/health
```

### 4. Redis Setup
```bash
# Install Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Verify Redis
redis-cli ping  # Should return PONG
```

### 5. Verify Setup
```bash
# Run dependency tests
poetry run pytest tests/test_dependencies.py -v

# Run all tests
poetry run pytest
```

## Production Setup

### 1. Environment Configuration
Set up the following environment variables:
```bash
# OpenAI
export OPENAI_API_KEY=your_api_key

# Supabase Production
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_supabase_key

# ElastiCache Redis
export REDIS_HOST=your.redis.cache.amazonaws.com
export REDIS_PORT=6379
export REDIS_SSL=true
```

### 2. ElastiCache Redis Setup
```python
# In production code
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    ssl=True,
    ssl_cert_reqs=None,
    decode_responses=True
)
```

### 3. Supabase Production Setup
1. Create production project in Supabase
2. Set up vector extension
3. Configure auth settings
4. Set up proper security policies

### 4. Deployment
```bash
# Build package
poetry build

# Deploy (example with uvicorn)
poetry run uvicorn rag_aether.api:app --host 0.0.0.0 --port 8000
```

## Security Considerations

### 1. API Keys
- Rotate regularly
- Use environment variables
- Never commit to source control
- Use secrets management in production

### 2. Redis Security
- Enable SSL/TLS
- Use strong passwords
- Configure proper network security
- Regular security updates

### 3. Supabase Security
- Enable RLS policies
- Use proper authentication
- Regular backups
- Monitor access logs

## Performance Tuning

### 1. Redis Configuration
```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
```

### 2. System Settings
```python
# In config.py
MEMORY_THRESHOLD = 0.85
CACHE_TTL = 3600
BATCH_SIZE = 100
```

### 3. Model Configuration
```python
MODEL_CONFIG = {
    "query_expansion": {
        "model": "t5-small",
        "max_length": 128,
        "num_return_sequences": 3,
        "temperature": 0.7
    }
}
```

## Monitoring Setup

### 1. Health Checks
```bash
# Verify system health
curl http://localhost:8000/health

# Check metrics
curl http://localhost:8000/metrics
```

### 2. Logging Configuration
```python
# In logging.conf
[loggers]
keys=root,rag_system

[handlers]
keys=console,file

[formatters]
keys=standard

[logger_rag_system]
level=INFO
handlers=console,file
qualname=rag_system
propagate=0
```

### 3. Alert Configuration
```python
# In monitoring.py
set_alert_threshold("memory_usage", 85)
set_alert_threshold("error_rate", 5)
set_alert_threshold("query_time", 1000)
```

## Troubleshooting

### 1. Common Issues
- Redis connection errors
- Memory usage alerts
- Slow query responses
- Cache misses

### 2. Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with debug output
poetry run pytest -v --log-cli-level=DEBUG
```

### 3. Performance Issues
```bash
# Run benchmarks
poetry run pytest tests/performance/test_speed.py --benchmark-only

# Check memory usage
python tests/performance/test_memory.py
```

## Maintenance

### 1. Regular Tasks
- Monitor system metrics
- Review error logs
- Update dependencies
- Backup data regularly

### 2. Updates
```bash
# Update dependencies
poetry update

# Run tests after updates
poetry run pytest

# Check for security advisories
poetry show --tree
```

### 3. Backup Procedures
```bash
# Redis backup
redis-cli save

# Supabase backup
supabase db dump -f backup.sql
``` 