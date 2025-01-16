# RAG Aether MVP

A streamlined Retrieval-Augmented Generation system with React frontend.

## Setup

### Backend
```bash
# Install dependencies
pip install -e ".[dev]"

# Run the FastAPI server
uvicorn rag_aether.api.routes:app --reload
```

### Frontend
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Features

- Document ingestion with metadata support
- Vector search using FAISS
- Basic query caching
- React UI with TypeScript
- Tailwind styling

## Development

### Backend Tests
```bash
pytest
```

### Frontend Development
```bash
# Lint
npm run lint

# Format
npm run format

# Build
npm run build
```

## API Endpoints

- `POST /documents` - Add documents
- `POST /search` - Search documents
- `GET /health` - Health check

## Environment Variables

Create a `.env` file:

```
MODEL_NAME=BAAI/bge-small-en
USE_CACHE=true
``` 