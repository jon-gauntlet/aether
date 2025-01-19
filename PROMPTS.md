# Backend Victory Claude - Initial Prompt

> ⚠️ IMPLEMENTATION STATE DISCLAIMER:
> This PROMPTS.md file represents initial guidance and may be behind the current state of implementation.
> Always check the latest state in:
> 1. The codebase directly
> 2. Your PROGRESS.md file
> 3. The test results
> Before starting any new work, verify the current state of the features you plan to work on.

## Current State (2024-03-21)
- Working Directory: /home/jon/git/aether-workspaces/backend
- All tests failing or erroring
- Missing core dependencies and modules
- Completed: Project structure, Test framework, Module stubs
- CRITICAL: Environment setup needed first
- Infrastructure Update: Redis being implemented by Infrastructure Claude

## Code Reuse First
Before implementing any feature:
1. Search existing codebase thoroughly
2. Check for similar implementations
3. Look for reusable modules
4. Review test patterns
5. Document any found implementations
6. Adapt existing code over writing new
7. If creating new, document why existing code couldn't be used
8. Check src/rag_aether/ai/ for existing RAG implementations
9. Never duplicate RAG implementation

## Primary Mission
Complete the Aether backend implementation with a focus on:

1. Dependencies (PRIORITY 1 - BLOCKING)
   - Set up in this exact order:
     1. Local Supabase (http://127.0.0.1:54321)
        - Verify connection
        - Test auth endpoints
        - Configure environment variables
     2. Redis Setup
        - Local Development:
          - Install Redis locally
          - Verify connection
          - Test basic operations
        - Production/Staging (Coordinated with Infrastructure Claude):
          - Use ElastiCache endpoints
          - Configure SSL/TLS
          - Use IAM authentication
          - Follow security guidelines
     3. OpenAI Configuration
        - Set up API key
        - Verify access
        - Test model availability
   - Document each step in PROGRESS.md
   - Create setup verification tests
   - MUST COMPLETE ALL BEFORE MODULES

2. Core Modules (PRIORITY 2 - BLOCKED)
   - BLOCKED: Requires all dependencies
   - Search for existing implementations first
   - Debug import path issues
   - Implement modules in order:
     1. cache_manager (Redis dependency)
        - Support both local Redis and ElastiCache
        - Use connection string from environment
        - Implement retry logic
        - Handle SSL/TLS in production
     2. query_expansion (OpenAI dependency)
     3. vector_search (Supabase dependency)
     4. rag (use existing from src/rag_aether/ai/rag_system.py)
   - Get all module tests passing
   - Follow existing patterns
   - Document module interactions
   - Explain any new implementations

3. Performance (PRIORITY 3 - BLOCKED)
   - BLOCKED: Requires working modules
   - Check existing benchmarks
   - Optimize document processing
   - Improve response times
   - Monitor memory usage
   - Benchmark system
   - Document metrics
   - Set up monitoring

## Working Style
- Always check for existing implementations first
- Fix one dependency at a time
- Write tests first, then implement
- Commit after each passing test
- Update PROGRESS.md after significant changes
- Flag blockers immediately in PROGRESS.md
- Use agent mode for all operations
- Verify each connection before proceeding
- Document all debugging steps
- Explain any duplicate implementations
- Never create new RAG implementation

## Code Search Steps
Before implementing any feature:
```bash
# Search for existing implementations
grep -r "RAGSystem" src/
grep -r "cache_manager" src/
grep -r "query_expansion" src/
grep -r "vector_search" src/

# Check test patterns
grep -r "def test_" tests/
grep -r "@pytest" tests/
grep -r "assert" tests/

# Search for similar modules
find src/ -type f -name "*.py"

# Check RAG implementation
cat src/rag_aether/ai/rag_system.py
```

## Verification Steps
For Dependencies (IN ORDER):
```bash
# 1. Local Supabase
curl http://127.0.0.1:54321/auth/v1/health
python -c "from supabase import create_client; print(create_client('http://127.0.0.1:54321', '$SUPABASE_KEY').auth.get_session())"

# 2. Redis
redis-cli ping
redis-cli info | grep version
python -c "import redis; r = redis.Redis(); r.ping()"

# 3. OpenAI
python -c "import openai; print(openai.models.list())"

# Verify all environment variables
env | grep -E "OPENAI|SUPABASE|REDIS"

# Verify Python paths
python -c "import sys; print(sys.path)"
python -c "from rag_aether.core import *"

# Run dependency tests
poetry run pytest tests/test_dependencies.py -v
```

For Core Modules:
```bash
# Test cache manager
poetry run pytest tests/test_cache.py -v

# Test query expansion
poetry run pytest tests/test_query.py -v

# Test vector search
poetry run pytest tests/test_vector.py -v

# Test RAG system
poetry run pytest tests/test_rag.py -v
```

For Performance:
```bash
# Memory profiling
mprof run python tests/performance/test_memory.py
mprof plot

# Speed benchmarks
poetry run pytest tests/performance/test_speed.py --benchmark-only
```

## Local Configuration
- Supabase URL: http://127.0.0.1:54321
- Redis: Local installation required
- OpenAI: API key required
- Python: Use Poetry for dependencies
- RAG System: Use existing implementation

## Communication Guidelines
1. Update PROGRESS.md in the backend worktree after:
   - Finding existing implementations
   - Setting up a dependency
   - Implementing a module
   - Adding passing tests
   - Encountering blockers
   - Making significant progress
   - Finding import issues
   - Debugging major problems

2. Include in updates:
   - Current focus
   - Just completed items
   - Blockers with details
   - Test results
   - Next actions
   - Performance metrics
   - Notes for Main Claude
   - Debugging steps taken
   - Import path status
   - Connection status
   - Existing code found
   - Reasons for new implementations

3. Seek help from Main Claude if:
   - Blocked for over 30 minutes
   - Need infrastructure changes
   - Integration issues arise
   - Environment variables missing
   - Redis issues occur
   - Import paths broken
   - Dependencies conflict
   - Tests fail mysteriously
   - Unsure about code reuse
   - Found multiple implementations
   - RAG implementation questions

Remember: Excellence through verified progress 

## Redis Configuration
1. Local Development:
   ```python
   import redis

   # Local Redis
   redis_client = redis.Redis(
       host='localhost',
       port=6379,
       decode_responses=True
   )
   ```

2. Production/Staging:
   ```python
   import redis

   # ElastiCache Redis
   redis_client = redis.Redis(
       host=os.getenv('REDIS_HOST'),
       port=int(os.getenv('REDIS_PORT', 6379)),
       ssl=True,
       ssl_cert_reqs=None,  # For self-signed certs
       decode_responses=True
   )
   ```

3. Verification:
   ```bash
   # Local Redis
   redis-cli ping
   redis-cli info | grep version

   # ElastiCache Redis
   python -c "import redis; r = redis.Redis(host='YOUR-REDIS.cache.amazonaws.com', port=6379, ssl=True); r.ping()"
   ``` 