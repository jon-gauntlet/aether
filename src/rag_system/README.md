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
   ```

2. Run the server:
   ```bash
   poetry run python run.py
   ```

The server will start at `http://localhost:8100`.

## API Endpoints

### Health Check
```http
GET /api/v1/health
```

Checks if the system is running and properly initialized.

**Response**
```json
{
    "status": "healthy",
    "rag_system_ready": true,
    "message": null
}
```

### Add Document
```http
POST /api/v1/documents/{doc_id}
```

Adds a document to the RAG system's knowledge base.

**Parameters**
- `doc_id` (path): Unique identifier for the document

**Request Body**
```json
{
    "content": "Document text content",
    "metadata": {
        "type": "article",
        "source": "example.com",
        // ... any additional metadata
    }
}
```

**Response**
```json
{
    "status": "success",
    "message": "Document doc_id added successfully"
}
```

### Query
```http
POST /api/v1/query
```

Queries the RAG system with a question.

**Request Body**
```json
{
    "question": "What is the capital of France?"
}
```

**Response**
```json
{
    "answer": "Based on the context, Paris is the capital of France.",
    "context": [
        "The capital of France is Paris.",
        // ... other relevant document contents
    ]
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (empty content/question)
- `500`: Internal Server Error (Anthropic API issues)
- `503`: Service Unavailable (RAG system not initialized)

Error responses include a detail message:
```json
{
    "detail": "Error message here"
}
```

## Development

### Running Tests
```bash
poetry run pytest tests/test_rag.py -v
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| ANTHROPIC_API_KEY | Your Anthropic API key | Yes |
| PORT | Server port (default: 8100) | No |
| HOST | Server host (default: 0.0.0.0) | No |

## Frontend Integration Example

```typescript
// Example using fetch API
const API_BASE = 'http://localhost:8100/api/v1';

// Add a document
async function addDocument(docId: string, content: string, metadata = {}) {
    const response = await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, metadata })
    });
    return response.json();
}

// Query the system
async function queryRAG(question: string) {
    const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
    });
    return response.json();
}

// Check system health
async function checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
}
``` 