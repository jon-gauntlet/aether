#!/bin/bash

# Function to cleanup background processes on exit
cleanup() {
    echo "Cleaning up processes..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "Poetry is not installed. Please install it first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install it first."
    exit 1
fi

echo "Starting Aether RAG Demo..."

# Start FastAPI backend
echo "Starting FastAPI backend..."
cd "$(dirname "$0")/.."
poetry run uvicorn src.rag_aether.api.routes:app --reload --port 8000 &
backend_pid=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start Next.js frontend
echo "Starting Next.js frontend..."
npm run dev &
frontend_pid=$!

echo "
🚀 Demo is running!

Frontend: http://localhost:3000
Backend:  http://localhost:8000
API Docs: http://localhost:8000/docs

Press Ctrl+C to stop all services
"

# Wait for either process to exit
wait $backend_pid $frontend_pid 