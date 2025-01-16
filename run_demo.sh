#!/bin/bash

# Start FastAPI backend
echo "Starting FastAPI backend..."
poetry run uvicorn rag_aether.api.mvp_endpoints:app --reload --port 8080 &
BACKEND_PID=$!

# Start React frontend with Vite
echo "Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

# Handle cleanup on script exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait 