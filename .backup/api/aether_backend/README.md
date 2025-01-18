# RAG System with Claude

A Retrieval Augmented Generation system built with FastAPI and Claude.

## Features

- Document ingestion and storage
- Semantic search using sentence transformers
- Document retrieval API
- RAG-powered question answering using Claude
- Built-in CORS support
- Simple text file upload

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Edit the `.env` file and add your Anthropic API key.

## Running the Server

```bash
python run.py
```

The server will start at `http://localhost:8000`. You can access the API documentation at `http://localhost:8000/docs`.

## API Endpoints

- `POST /api/documents/upload`: Upload a text document
- `GET /api/documents`: List all documents
- `POST /api/documents/search`: Search documents using semantic similarity
- `POST /api/rag/query`: Query the system using RAG with Claude
- `GET /health`: Health check endpoint

## Usage Example

1. Upload a document:
```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.txt" \
  -F "title=Example Document"
```

2. Search documents:
```bash
curl -X POST "http://localhost:8000/api/documents/search" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"query": "your search query", "top_k": 5}'
```

3. Query using RAG:
```bash
curl -X POST "http://localhost:8000/api/rag/query" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"query": "your question here", "top_k": 3}'
```

The RAG query endpoint will:
1. Find the most relevant documents for your query
2. Use Claude to generate a response based on those documents
3. Return both the response and the source documents used 