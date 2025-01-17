# RAG System API Documentation

## Overview
This is a Retrieval Augmented Generation (RAG) system that uses Anthropic's Claude API to provide context-aware responses based on your documents.

## Quick Start

1. Set up environment:
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Add your Anthropic API key
   echo "ANTHROPIC_API_KEY=your_key_here" >> .env
   
   # Install dependencies
   poetry install
   
   # Start Redis using Docker (optional, for future caching)
   docker-compose up -d redis
   ```

2. Run the server:
   ```bash
   poetry run python run.py
   ```

The server will start at `http://localhost:8100`.

## Dependencies

### Required
- Python 3.12+
- Poetry
- Anthropic API key
- Docker & Docker Compose (for Redis)

### Optional Services
- Redis (installed but not currently used, prepared for future caching)
  - Runs in Docker container
  - Default connection: localhost:6379
  - Persistent storage using Docker volume
  - Can be configured via environment variables:
    ```
    REDIS_HOST=localhost
    REDIS_PORT=6379
    REDIS_DB=0
    ```

## Docker Services

### Redis
- Image: redis:7.2
- Persistence: Yes (AOF mode)
- Health checks: Enabled
- Data volume: redis_data

To start Redis:
```bash
docker-compose up -d redis
```

To check Redis status:
```bash
docker-compose ps redis
```

To stop Redis:
```bash
docker-compose stop redis
``` 