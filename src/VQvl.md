# GauntletAI LMS Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Meilisearch
- Docker & Docker Compose

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/ai-lms.git
cd ai-lms
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Required variables:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_lms"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
GOOGLE_ID="your-google-id"
GOOGLE_SECRET="your-google-secret"

# Services
REDIS_URL="redis://localhost:6379"
MEILI_HOST="http://localhost:7700"
MEILI_MASTER_KEY="your-master-key"
```

## Development Environment

1. Start services:
```bash
npm run services:up
```

2. Initialize database:
```bash
npx prisma db push
```

3. Start development server:
```bash
npm run dev
```

## Production Deployment

### Docker Deployment

1. Build the image:
```bash
docker build -t ai-lms .
```

2. Deploy with Docker Compose:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Database Migration

1. Generate migration:
```bash
npx prisma migrate deploy
```

2. Seed initial data:
```bash
npx prisma db seed
```

## Monitoring & Maintenance

### Health Checks

Monitor service health:
```bash
npm run test:services
```

### Backup & Recovery

1. Database backup:
```bash
pg_dump -U postgres ai_lms > backup.sql
```

2. Redis backup:
```bash
redis-cli save
```

3. Meilisearch backup:
```bash
tar -czf meili_data.tar.gz /meili_data
```

### Performance Optimization

1. Enable Redis caching:
```typescript
// src/lib/redis.ts
export const CACHE_TIMES = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
}
```

2. Configure Meilisearch indices:
```typescript
// src/lib/meilisearch.ts
await client.updateSettings({
  searchableAttributes: ['title', 'content'],
  filterableAttributes: ['type', 'status'],
})
```

## Security Considerations

1. Enable rate limiting:
```typescript
// src/middleware.ts
export const config = {
  matcher: '/api/:path*',
}
```

2. Configure CORS:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}
```

3. Set security headers:
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]
```

## Troubleshooting

Common issues and solutions:

1. Database connection errors:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -U postgres -d ai_lms
```

2. Redis connection issues:
```bash
# Check Redis status
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL
```

3. Meilisearch problems:
```bash
# Check Meilisearch status
curl http://localhost:7700/health

# Reset indices
curl -X DELETE http://localhost:7700/indexes -H "Authorization: Bearer $MEILI_MASTER_KEY"
``` 