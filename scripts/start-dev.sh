#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Aether Development Environment${NC}"

# Start Supabase
echo -e "${GREEN}Starting Supabase...${NC}"
supabase start

# Ensure Python environment is ready
echo -e "${GREEN}Setting up Python environment...${NC}"
poetry install
poetry run pip install --upgrade pip

# Start backend in background
echo -e "${GREEN}Starting backend server...${NC}"
poetry run uvicorn src.rag_aether.api:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo -e "${GREEN}Starting frontend server...${NC}"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT 