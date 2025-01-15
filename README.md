# Aether RAG System

A professional-grade RAG (Retrieval-Augmented Generation) system with Firebase integration.

## Features

- Semantic search using FAISS and sentence-transformers
- Real-time updates with Firebase
- Async API with FastAPI
- Professional-grade LLM integration with Claude

## Setup

1. Install dependencies:
```bash
poetry install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` with your:
- Anthropic API key
- Path to Firebase service account JSON file

3. Start the demo:
```bash
./scripts/start-demo.sh
```

## Testing

Run the test suite:
```bash
poetry run pytest
```

Or test the RAG system directly:
```bash
poetry run python scripts/test_rag_query.py
```

## Architecture

The system consists of three main components:

1. **Vector Store**: Uses FAISS for efficient similarity search and sentence-transformers for embeddings
2. **Firebase Integration**: Real-time data synchronization and persistence
3. **LLM Integration**: Direct integration with Claude API for high-quality responses

## Development

- Code style: Black + isort
- Type checking: mypy
- Testing: pytest + pytest-asyncio 
