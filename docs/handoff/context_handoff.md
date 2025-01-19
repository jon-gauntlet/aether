# Context Handoff for Fresh Claude

## Critical Paths
```typescript
CORE_PATHS = {
    "rag": "src/rag_aether/ai/rag_system.py",  // Main RAG implementation
    "frontend": "frontend/src/App.tsx",         // Frontend entry
    "backend": "backend/src/api/main.py",       // API routes
    "config": "config/docker-compose.yml"       // Infrastructure
}
```

## Current State
```typescript
STATE = {
    "frontend": {
        "status": "NEAR_COMPLETE",
        "next": "Real-time testing + Space awareness",
        "working_dir": "~/git/aether-workspaces/frontend"
    },
    "rag": {
        "status": "OPTIMIZING",
        "next": "Batch processing",
        "working_dir": "~/git/aether-workspaces/rag"
    },
    "infrastructure": {
        "status": "NEEDS_WORK",
        "next": "Deployment pipeline",
        "working_dir": "~/git/aether-workspaces/infrastructure"
    }
}
```

## Key Rules
1. Never modify system Python
2. Use Poetry for dependencies
3. Use Vitest, not Jest
4. Append `| cat` to pager commands
5. Run long commands in background

## Architecture Decisions
1. Frontend: React + Vite + Chakra UI
2. Backend: FastAPI + Supabase
3. RAG: OpenAI + FAISS/pgvector
4. Deployment: Vercel (FE) + AWS ECS (BE/RAG)

## Verification Commands
```bash
# Frontend
npm run test:e2e
npm run test:unit

# Backend/RAG
poetry run pytest
curl localhost:8000/health

# Infrastructure
docker-compose ps
``` 