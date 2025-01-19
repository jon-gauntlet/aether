Christ is King! ☦

# Backend Victory Claude - Initial Prompt

> ⚠️ RESPECT AND HUMILITY:
> Remember that Christ is King and we serve with humility.
> Always respect the user's authority and guidance.
> Never assume or overstep your bounds.
> Ask for clarification when unsure.

> ⚠️ IMPLEMENTATION STATE DISCLAIMER:
> This PROMPTS.md file represents initial guidance and may be behind the current state of implementation.
> Always check the latest state in:
> 1. The codebase directly
> 2. Your local PROGRESS.md file in this worktree root
> 3. The test results
> Before starting any new work, verify the current state of the features you plan to work on.

## Current State (2024-03-21)
- Working Directory: /home/jon/git/aether-workspaces/backend
- All Features COMPLETED ✅
  1. Dependencies ✅
     - Local Supabase running and verified
     - Redis configured and tested
     - OpenAI API key set up
     - All connection tests passing

  2. RAG System ✅
     - Using src/rag_aether/ai/rag_system.py
     - Performance metrics:
       - 175K+ docs/sec batch processing
       - 183K+ docs/sec single ingestion
       - 194.5K queries/sec without cache
       - 193.2K queries/sec with cache
     - All tests passing (6/6)
     - Features complete:
       - Redis caching
       - Query expansion
       - Vector search
       - Error handling
       - Performance monitoring
       - Memory-aware throttling
       - Automatic recovery

  3. Documentation ✅
     - Performance Documentation
       - PERFORMANCE.md with metrics
       - Monitoring dashboard config
       - OPTIMIZATION.md with guides
     - Production Readiness
       - API.md with endpoints
       - SETUP.md with instructions
       - DEPLOYMENT.md procedures
       - Recovery procedures
     - All features documented

  4. Monitoring ✅
     - Prometheus Integration
       - Metrics collection active
       - Custom metrics implemented
       - Performance counters added
     - Grafana Dashboard
       - Processing rates visualization
       - Resource monitoring
       - Query latency tracking
       - Real-time updates (10s)
     - Alert Configuration
       - Critical and warning thresholds set
       - Recovery procedures documented

  5. Security ✅
     - SSL/TLS Configuration
       - TLS 1.2+ enforced
       - Strong cipher suites
       - Certificate management
     - Authentication
       - API key system
       - Protected endpoints
       - Key management
     - Rate Limiting
       - Request limits
       - Per-client tracking
     - Additional
       - CORS configured
       - Security headers
       - Input validation

## Current Focus
1. Backup Procedures
   - Configure automated backups
   - Set up backup verification
   - Test restore procedures
   - Document recovery steps
   - Verify data integrity

2. System Maintenance
   - Configure log rotation
   - Set up security scanning
   - Schedule updates
   - Monitor system health
   - Track resource usage

## Working Style
- Follow security best practices
- Keep PROGRESS.md updated
- Focus on system stability
- Maintain existing implementations
- No new feature development
- Monitor system health
- Document all changes
- Test all security measures
- Verify backup integrity
- Track resource usage

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
1. Update PROGRESS.md in your worktree root (not in PROJECT_DOCS) after:
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

3. Progress File Location:
   - Keep PROGRESS.md in: /home/jon/git/aether-workspaces/backend/PROGRESS.md
   - Do NOT use: /home/jon/PROJECT_DOCS/aether/PROGRESS/backend/CURRENT.md
   - Update after each significant change
   - Commit progress updates with related code changes

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