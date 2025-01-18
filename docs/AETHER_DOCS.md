# 🌟 Aether Project Documentation

<llm_marker:metadata>
```typescript
// Critical metadata for LLMs
AETHER_METADATA = {
    "last_updated": "2024-01-18",
    "version": "1.0.0",
    "key_paths": {
        "rag_system": "src/rag_aether/ai/rag_system.py",
        "frontend_app": "frontend/src/App.tsx",
        "backend_api": "backend/src/api/main.py",
        "tests": {
            "frontend": "frontend/tests",
            "backend": "backend/tests",
            "rag": "src/rag_aether/tests"
        }
    },
    "documentation_version": "LLM-OPTIMIZED-V1",
    "repository": "https://github.com/yourusername/aether",
    "required_tools": {
        "python": "^3.10",
        "node": "^18",
        "poetry": "^1.4",
        "docker": "^24",
        "docker-compose": "^2.20"
    }
}
```
</llm_marker:metadata>

<llm_marker:environment_setup>
```typescript
// Environment setup for LLMs
ENVIRONMENT_SETUP = {
    "required_env_vars": {
        "OPENAI_API_KEY": {
            "description": "OpenAI API key for embeddings and completions",
            "example": "sk-...",
            "required": true
        },
        "SUPABASE_URL": {
            "description": "Supabase project URL",
            "example": "https://*.supabase.co",
            "required": true
        },
        "SUPABASE_KEY": {
            "description": "Supabase anon key",
            "example": "eyJ...",
            "required": true
        }
    },
    "setup_sequence": [
        {
            "step": "Clone repository",
            "command": "git clone https://github.com/yourusername/aether",
            "verification": "ls aether"
        },
        {
            "step": "Install dependencies",
            "command": "poetry install && cd frontend && npm install",
            "verification": "poetry run python -c 'import rag_aether' && cd frontend && npm run build"
        },
        {
            "step": "Start services",
            "command": "docker-compose up -d && poetry run uvicorn main:app --reload",
            "verification": "curl localhost:8000/health"
        }
    ]
}
```
</llm_marker:environment_setup>

<llm_marker:project_status>
```typescript
// Project status for LLMs
PROJECT_STATUS = {
    "overall": {
        "completion": 0.88,
        "grade": "A-",
        "last_verified": "2024-01-18"
    },
    "components": {
        "frontend": {
            "completion": 0.85,
            "grade": "B+",
            "features": {
                "auth": "COMPLETE",
                "chat": "NEAR_COMPLETE",
                "real_time": "TESTING",
                "space_awareness": "IN_PROGRESS"
            },
            "verification": "npm run test:e2e && npm run test:unit"
        },
        "backend": {
            "completion": 0.90,
            "grade": "A-",
            "features": {
                "api": "COMPLETE",
                "websocket": "COMPLETE",
                "database": "COMPLETE",
                "performance": "OPTIMIZING"
            },
            "verification": "poetry run pytest"
        },
        "rag": {
            "completion": 0.90,
            "grade": "A",
            "features": {
                "vector_search": "COMPLETE",
                "embeddings": "COMPLETE",
                "caching": "COMPLETE",
                "batch_processing": "OPTIMIZING"
            },
            "verification": "python -m rag_aether.verify"
        }
    }
}
```
</llm_marker:project_status>

<llm_marker:system_architecture>
```typescript
// System architecture for LLMs
SYSTEM_ARCHITECTURE = {
    "components": {
        "frontend": {
            "framework": "React + Vite",
            "ui": "Chakra UI",
            "state": "React Query + Context",
            "real_time": "WebSocket + Supabase Realtime",
            "testing": "Vitest",
            "patterns": {
                "components": "Compound Pattern",
                "state": "React Query + Context",
                "errors": "Error Boundary Pattern"
            }
        },
        "backend": {
            "framework": "FastAPI",
            "database": "Supabase (PostgreSQL)",
            "real_time": "WebSocket (FastAPI)",
            "testing": "Pytest",
            "patterns": {
                "api": "Repository Pattern",
                "websocket": "PubSub Pattern",
                "errors": "Domain Error Types"
            }
        },
        "rag": {
            "embeddings": "OpenAI",
            "vector_store": "FAISS + Supabase pgvector",
            "caching": "LRU Cache",
            "chunking": "1000 tokens, 200 overlap",
            "patterns": {
                "implementation": "BaseRAG Extension",
                "caching": "LRU Pattern",
                "errors": "RAGError Types"
            }
        }
    },
    "interfaces": {
        "frontend_to_backend": {
            "rest": "/api/*",
            "websocket": "ws://*/ws",
            "rag": "/api/rag/*"
        },
        "backend_to_rag": "Internal API",
        "backend_to_db": "Supabase Client"
    },
    "database_schema": {
        "messages": {
            "id": "uuid",
            "content": "text",
            "user_id": "uuid",
            "channel_id": "uuid",
            "created_at": "timestamp",
            "vector": "vector(1536)"
        },
        "channels": {
            "id": "uuid",
            "name": "text",
            "type": "enum('public', 'private', 'dm')"
        }
    }
}
```
</llm_marker:system_architecture>

<llm_marker:requirements>
```typescript
// System requirements for LLMs
SYSTEM_REQUIREMENTS = {
    "performance": {
        "frontend": {
            "time_to_interactive": {
                "target": "< 1.5s",
                "verification": "lighthouse --only-categories=performance"
            },
            "message_latency": {
                "target": "< 100ms",
                "verification": "frontend/tests/perf/message-latency.test.ts"
            }
        },
        "backend": {
            "api_response_time": {
                "target": "< 200ms",
                "verification": "backend/tests/perf/api-latency.test.py"
            },
            "websocket_latency": {
                "target": "< 50ms",
                "verification": "backend/tests/perf/ws-latency.test.py"
            }
        },
        "rag": {
            "query_time": {
                "target": "< 1s",
                "verification": "rag_aether/tests/perf/query-time.test.py"
            },
            "cache_hit_ratio": {
                "target": "> 0.8",
                "verification": "rag_aether/tests/perf/cache-hits.test.py"
            }
        }
    },
    "reliability": {
        "uptime": {
            "target": "99.9%",
            "verification": "curl localhost:8000/metrics | grep uptime"
        },
        "error_rate": {
            "target": "< 0.1%",
            "verification": "curl localhost:8000/metrics | grep errors"
        }
    }
}
```
</llm_marker:requirements>

<llm_marker:emergency_procedures>
```typescript
// Emergency procedures for LLMs
EMERGENCY_PROCEDURES = {
    "system_failure": {
        "detection": {
            "command": "curl localhost:8000/health",
            "expected": "{'status': 'healthy'}",
            "frequency": "every 1m"
        },
        "immediate_actions": [
            {
                "step": "Check logs",
                "command": "docker-compose logs --tail=100"
            },
            {
                "step": "Restart services",
                "command": "docker-compose restart",
                "verification": "curl localhost:8000/health"
            }
        ],
        "if_persists": [
            {
                "step": "Rollback deployment",
                "command": "git reset --hard HEAD~1",
                "verification": "git status"
            },
            {
                "step": "Restore database",
                "command": "psql -f backup.sql",
                "verification": "psql -c 'SELECT COUNT(*) FROM messages;'"
            }
        ]
    },
    "data_corruption": {
        "detection": {
            "command": "python scripts/verify_data.py",
            "frequency": "every 1h"
        },
        "recovery": {
            "step": "Restore from backup",
            "command": "pg_restore -d aether latest.dump",
            "verification": "python scripts/verify_data.py"
        }
    },
    "performance_degradation": {
        "detection": {
            "command": "curl localhost:8000/metrics",
            "threshold": "response_time > 500ms"
        },
        "actions": [
            {
                "step": "Clear caches",
                "command": "redis-cli FLUSHALL",
                "verification": "redis-cli INFO | grep used_memory"
            },
            {
                "step": "Scale up",
                "command": "docker-compose up -d --scale api=3",
                "verification": "docker-compose ps"
            }
        ]
    }
}
```
</llm_marker:emergency_procedures>

<llm_marker:remaining_tasks>
```typescript
// Remaining tasks for LLMs
REMAINING_TASKS = {
    "high_priority": [
        {
            "task": "Complete real-time testing",
            "component": "frontend",
            "estimate": "1 day",
            "verification": "npm run test:e2e -- --grep 'real-time'",
            "acceptance": [
                "All real-time test cases pass",
                "Latency under 100ms",
                "No memory leaks"
            ]
        },
        {
            "task": "Implement batch processing",
            "component": "rag",
            "estimate": "2 days",
            "verification": "python -m rag_aether.verify --test-batch",
            "acceptance": [
                "Process 1000 docs/min",
                "Memory usage stable",
                "No query degradation"
            ]
        }
    ],
    "medium_priority": [
        {
            "task": "Refine space awareness",
            "component": "frontend",
            "estimate": "3 days",
            "verification": "npm run test:space",
            "acceptance": [
                "Correct space boundaries",
                "Efficient updates",
                "No UI jank"
            ]
        }
    ]
}
```
</llm_marker:remaining_tasks>