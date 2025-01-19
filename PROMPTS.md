Christ is King! ☦

# Frontend Victory Claude - Initial Prompt

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
- Working Directory: /home/jon/git/aether-workspaces/frontend
- Branch: victory/frontend

1. Test Framework Migration ✅ COMPLETED
   - Successfully migrated from Playwright to Vitest
   - Using @testing-library/react for components
   - Configured for React 18 concurrent mode
   - All test utilities properly configured
   - Playwright removed
   - Test coverage maintained

2. Authentication (PRIORITY 1) - IN PROGRESS 🔄
   - Local Supabase verified and configured ✅
   - Environment variables configured correctly ✅
   - Test environment issues:
     - Token storage tests failing (3 failures)
     - Error message display tests failing (2 failures)
     - Logout functionality tests failing (4 failures)
     - React 18 concurrent mode warnings
   - Next: Fix test environment and failures

3. File Handling (PRIORITY 2) - BLOCKED ⛔
   - Blocked by Authentication completion
   - Storage bucket verified and accessible
   - Initial test structure ready
   - Ready to implement once auth fixed

4. WebSocket (PRIORITY 3) - BLOCKED ⛔
   - Blocked by File Handling
   - WebSocket endpoint verified
   - Initial configuration in place
   - Backend infrastructure ready ✅
     - Redis endpoint: master.aers3l8mlzy85ti.8jeuns.usw2.cache.amazonaws.com:6379
     - Performance verified at 193K+ queries/sec
     - Monitoring active with Prometheus/Grafana

## Current Focus
1. Test Environment Fixes
   - Resolve React 18 concurrent mode warnings
   - Fix async operation handling
   - Update cleanup procedures
   - Improve test timeouts

2. Authentication Tests
   - Fix token storage in localStorage
   - Fix error message display
   - Fix logout functionality
   - Document auth flow once fixed

## Working Style
- Fix test environment first
- Keep PROGRESS.md updated
- Focus on one failure at a time
- Write tests first
- Verify all dependencies
- Monitor test coverage
- Follow security best practices
- Coordinate with Backend

## Code Reuse First
Before implementing any feature:
1. Search existing codebase thoroughly
2. Check for similar implementations
3. Look for reusable components
4. Review test patterns
5. Document any found implementations
6. Adapt existing code over writing new
7. If creating new, document why existing code couldn't be used

## Primary Mission
Complete the Aether frontend implementation with a focus on:

1. Authentication (PRIORITY 1)
   - Fix remaining test failures:
     - Debug token storage issues in tests
     - Fix error message display in tests
     - Resolve logout functionality in tests
   - Document auth flow
   - Complete auth implementation
   - Verify against local Supabase
   - MUST COMPLETE BEFORE OTHER FEATURES

2. File Handling (PRIORITY 2)
   - BLOCKED: Requires working authentication
   - Design file upload/download components
   - Implement file storage service
   - Add file management tests
   - Document file handling flow
   - Verify storage bucket configuration

3. WebSocket (PRIORITY 3)
   - BLOCKED: Requires Authentication and File Handling
   - Design WebSocket service
   - Implement real-time messaging
   - Add WebSocket tests
   - Document WebSocket architecture
   - Note: Will use Redis for pub/sub in production

## Code Search Steps
Before implementing any feature:
```bash
# Search for existing implementations
grep -r "createClient" src/
grep -r "supabase" src/
grep -r "auth" src/
grep -r "storage" src/
grep -r "websocket" src/

# Check test patterns
grep -r "describe" tests/
grep -r "test" tests/
grep -r "it(" tests/

# Search for similar components
find src/ -type f -name "*.jsx" -o -name "*.js"
```

## Verification Steps
For Authentication:
```bash
# Verify local Supabase is running
curl http://127.0.0.1:54321/auth/v1/health

# Check environment variables
env | grep SUPABASE

# Run auth tests (with timeout)
npm run test auth --timeout=30000

# Test specific auth issues
npm run test auth:token --timeout=30000
npm run test auth:errors --timeout=30000
npm run test auth:logout --timeout=30000
```

For File Handling (BLOCKED):
```bash
# Verify local storage bucket
curl http://127.0.0.1:54321/storage/v1/bucket -H "Authorization: Bearer $SUPABASE_KEY"

# Run file tests
npm run test file
```

For WebSocket (BLOCKED):
```bash
# Test local WebSocket endpoint
curl -I http://127.0.0.1:54321/realtime/v1/websocket

# Run WebSocket tests
npm run test websocket
```

For all tests:
```bash
npm run test
```

## Local Supabase Configuration
- URL: http://127.0.0.1:54321
- Auth enabled with email signup
- Site URL: http://127.0.0.1:3000
- JWT expiry: 1 hour
- Password minimum length: 6
- Storage enabled with 50MB limit
- Realtime enabled on port 54321

## Communication Guidelines
1. Update PROGRESS.md in your worktree root (not in PROJECT_DOCS) after:
   - Finding existing implementations
   - Completing a feature
   - Adding passing tests
   - Encountering blockers
   - Making significant progress
   - Finding integration issues
   - Debugging major problems
   - Fixing test environment issues

2. Include in updates:
   - Current focus
   - Just completed items
   - Blockers with details
   - Test results
   - Next actions
   - Notes for Main Claude
   - Debugging steps taken
   - Existing code found
   - Reasons for new implementations
   - Test environment status

3. Progress File Location:
   - Keep PROGRESS.md in: /home/jon/git/aether-workspaces/frontend/PROGRESS.md
   - Do NOT use: /home/jon/PROJECT_DOCS/aether/PROGRESS/frontend/CURRENT.md
   - Update after each significant change
   - Commit progress updates with related code changes

Remember: Excellence through verified progress 

## Testing Framework Standards
- Use Vitest for ALL testing (unit, integration, E2E)
- Never use Jest or Playwright
- Maintain consistent test patterns
- Follow existing test structure
- Use Vitest's browser testing for E2E
- Document test architecture decisions
- Configure for React 18 features
- Handle async operations properly
- Mock external services consistently
- Use @testing-library/react best practices

## Test Environment Setup
1. Required Configuration:
   - React 18 concurrent mode support
   - Proper async utility timeouts
   - Consistent event handling
   - Mock implementations for:
     - localStorage
     - fetch
     - WebSocket
     - ResizeObserver
     - matchMedia
   - Supabase auth mocking
   - Proper cleanup after tests

2. Common Issues:
   - Token storage in tests
   - Error message display
   - Async operation timing
   - React 18 concurrent mode
   - Mock implementation consistency

3. Debugging Steps:
   - Check test environment setup
   - Verify mock implementations
   - Review async operation handling
   - Validate cleanup procedures
   - Ensure proper event timing

## Testing Framework Migration
1. Current Status:
   - Playwright: Used for E2E tests (to be removed)
   - Vitest: Main testing framework
   
2. Migration Steps:
   - Review current Playwright tests
   - Set up Vitest browser testing
   - Migrate tests one feature at a time
   - Start with Authentication tests
   - Verify test coverage
   - Remove Playwright once complete

3. Verification:
   ```bash
   # Check current Playwright tests
   npx playwright test

   # Run Vitest tests
   npm run test

   # Check test coverage
   npm run coverage
   ``` 