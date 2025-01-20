# RAG System API Documentation



## Overview
The RAG (Retrieval-Augmented Generation) system provides high-performance document processing and querying capabilities with Redis caching and vector search.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All endpoints require an API key passed in the header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Document Ingestion

#### Single Document
```http
POST /documents
Content-Type: application/json

{
    "text": "string",
    "metadata": {
        "document_id": "string",
        "source": "string",
        "timestamp": "string",
        "tags": ["string"]
    }
}
```

Response:
```json
{
    "success": true,
    "document_id": "string",
    "vector_id": "string",
    "timestamp": "string"
}
```

#### Batch Documents
```http
POST /documents/batch
Content-Type: application/json

{
    "documents": [
        {
            "text": "string",
            "metadata": {
                "document_id": "string",
                "source": "string",
                "timestamp": "string",
                "tags": ["string"]
            }
        }
    ]
}
```

Response:
```json
{
    "success": true,
    "processed": 100,
    "failed": 0,
    "document_ids": ["string"],
    "vector_ids": ["string"],
    "timestamp": "string"
}
```

### 2. Query Processing

#### Basic Query
```http
POST /query
Content-Type: application/json

{
    "query": "string",
    "k": 5,
    "min_score": 0.7
}
```

Response:
```json
{
    "results": [
        {
            "document_id": "string",
            "text": "string",
            "score": 0.95,
            "metadata": {
                "source": "string",
                "timestamp": "string",
                "tags": ["string"]
            }
        }
    ],
    "query_id": "string",
    "timestamp": "string",
    "metrics": {
        "query_time_ms": 5.14,
        "cache_hit": false
    }
}
```

#### Advanced Query
```http
POST /query/advanced
Content-Type: application/json

{
    "query": "string",
    "k": 5,
    "min_score": 0.7,
    "filters": {
        "source": ["string"],
        "tags": ["string"],
        "date_range": {
            "start": "string",
            "end": "string"
        }
    },
    "options": {
        "use_cache": true,
        "expand_query": true,
        "rerank": true
    }
}
```

Response: Same as basic query with additional metrics.

### 3. System Management

#### Health Check
```http
GET /health
```

Response:
```json
{
    "status": "healthy",
    "components": {
        "redis": "connected",
        "vector_store": "connected",
        "query_expander": "ready"
    },
    "metrics": {
        "memory_usage": 65.5,
        "cache_size": 1024,
        "document_count": 10000
    }
}
```

#### Performance Metrics
```http
GET /metrics
```

Response:
```json
{
    "throughput": {
        "ingestion_rate": 175092,
        "query_rate": 194503,
        "cache_hit_ratio": 0.85
    },
    "latency": {
        "p50_ms": 5.14,
        "p95_ms": 7.82,
        "p99_ms": 10.45
    },
    "memory": {
        "usage_percent": 65.5,
        "cache_size_mb": 1024
    }
}
```

## Error Handling

### Error Response Format
```json
{
    "error": {
        "code": "string",
        "message": "string",
        "details": {}
    },
    "request_id": "string",
    "timestamp": "string"
}
```

### Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting
- Default: 1000 requests per minute
- Batch endpoints: 100 requests per minute
- Headers:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1616789000
  ```

## Best Practices
1. Document Ingestion
   - Use batch endpoint for multiple documents
   - Include comprehensive metadata
   - Clean text before submission
   - Handle rate limits appropriately

2. Querying
   - Use specific queries
   - Include relevant filters
   - Enable caching for repeated queries
   - Handle pagination properly

3. Error Handling
   - Implement exponential backoff
   - Handle rate limits gracefully
   - Log error responses
   - Monitor error rates

## SDK Examples

### Python
```python
from rag_aether import RAGClient

client = RAGClient(api_key="YOUR_API_KEY")

# Ingest document
response = await client.ingest_document(
    text="Document content",
    metadata={"source": "example"}
)

# Query
results = await client.query(
    query="Search query",
    k=5,
    min_score=0.7
)
```

### JavaScript
```javascript
import { RAGClient } from 'rag-aether';

const client = new RAGClient({ apiKey: 'YOUR_API_KEY' });

// Ingest document
const response = await client.ingestDocument({
    text: 'Document content',
    metadata: { source: 'example' }
});

// Query
const results = await client.query({
    query: 'Search query',
    k: 5,
    minScore: 0.7
});
``` 