#!/bin/bash

# Store process IDs
declare -A pids

# Cleanup function
cleanup() {
    echo "Cleaning up processes..."
    for key in "${!pids[@]}"; do
        pid=${pids[$key]}
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping $key (PID: $pid)"
            kill $pid
        fi
    done
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Function to wait for port to be available
wait_for_port() {
    local port=$1
    while lsof -i :$port >/dev/null 2>&1; do
        echo "Waiting for port $port to be available..."
        sleep 1
    done
}

# Ensure ports are available
wait_for_port 8000
wait_for_port 5173

# Start backend
echo "Starting backend server..."
poetry run python -m src.rag_aether.api.server &
pids["backend"]=$!

# Wait for backend to be ready
sleep 2

# Start frontend
echo "Starting frontend dev server..."
cd frontend && npm run dev &
pids["frontend"]=$!

# Keep script running
echo "Development environment running. Press Ctrl+C to stop."
wait 