#!/bin/bash
set -e

# Load environment variables
source .env

# Check required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY not set"
    exit 1
fi

if [ -z "$FIREBASE_SERVICE_ACCOUNT_PATH" ]; then
    echo "Error: FIREBASE_SERVICE_ACCOUNT_PATH not set"
    exit 1
fi

if [ ! -f "$FIREBASE_SERVICE_ACCOUNT_PATH" ]; then
    echo "Error: Firebase service account file not found at $FIREBASE_SERVICE_ACCOUNT_PATH"
    exit 1
fi

echo "🚀 Starting Aether RAG Demo..."

# Start FastAPI backend
echo "Starting FastAPI backend..."
poetry run uvicorn src.rag_aether.api.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Next.js frontend
echo "Starting Next.js frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Function to handle cleanup
cleanup() {
    echo "Shutting down..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Register cleanup function
trap cleanup SIGINT SIGTERM

echo "
🌐 Services running:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
   - API docs: http://localhost:8000/docs

Press Ctrl+C to stop all services.
"

# Wait for processes
wait 