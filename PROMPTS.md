# Frontend Victory Claude - Initial Prompt

> ⚠️ IMPLEMENTATION STATE DISCLAIMER:
> This PROMPTS.md file represents initial guidance and may be behind the current state of implementation.
> Always check the latest state in:
> 1. The codebase directly
> 2. Your PROGRESS.md file
> 3. The test results
> Before starting any new work, verify the current state of the features you plan to work on.

## Current State (2024-03-21)
- Working Directory: /home/jon/git/aether-workspaces/frontend
- All tests failing (0/3 features complete)
- Core features missing: Authentication, File Handling, WebSocket
- Completed: Project setup, Component structure, Test infrastructure
- Current Focus: Authentication (Priority 1)
- Testing Framework Migration Needed: Playwright → Vitest

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
   - FIRST: Migrate E2E tests from Playwright to Vitest
     - Review existing Playwright auth tests
     - Set up Vitest browser testing
     - Migrate auth E2E test cases
     - Remove Playwright dependency
     - Document migration in PROGRESS.md
   - Use local Supabase (http://127.0.0.1:54321)
   - Search for existing Supabase auth implementations
   - Debug Supabase auth integration issues
   - Implement sign in/out functionality
   - Add comprehensive error handling
   - Implement session management
   - Get auth tests passing first
   - Document auth flow
   - MUST COMPLETE BEFORE OTHER FEATURES

2. File Handling (PRIORITY 2)
   - BLOCKED: Requires working authentication
   - Search for existing file handling components
   - Implement upload/download/delete
   - Add progress indicators
   - Handle errors gracefully
   - Get file handling tests passing
   - Document file operations

3. WebSocket (PRIORITY 3)
   - BLOCKED: Requires working authentication
   - Search for existing WebSocket implementations
   - Implement real-time updates
   - Add connection management
   - Handle disconnects gracefully
   - Get WebSocket tests passing
   - Document WebSocket protocol

## Working Style
- Always check for existing implementations first
- Focus on one feature at a time
- Write tests first, then implement
- Commit after each passing test
- Update PROGRESS.md after significant changes
- Flag blockers immediately in PROGRESS.md
- Use agent mode for all operations
- Verify local Supabase before implementation
- Document all debugging steps
- Explain any duplicate implementations
- DO NOT start blocked features

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
find src/ -type f -name "*.vue" -o -name "*.js"
```

## Verification Steps
For Test Migration:
```bash
# Check current Playwright tests
ls tests/e2e/

# Check Vitest config
cat vitest.config.js

# Run current E2E tests
npm run test:e2e

# After migration, run new Vitest E2E tests
npm run test
```

For Authentication:
```bash
# Verify local Supabase is running
curl http://127.0.0.1:54321/auth/v1/health

# Check environment variables
env | grep SUPABASE

# Check Supabase client setup
grep -r "createClient" src/

# Run auth tests
npm run test auth
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
1. Update PROGRESS.md in the frontend worktree after:
   - Finding existing implementations
   - Completing a feature
   - Adding passing tests
   - Encountering blockers
   - Making significant progress
   - Finding integration issues
   - Debugging major problems

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

3. Seek help from Main Claude if:
   - Blocked for over 30 minutes
   - Need infrastructure changes
   - Integration issues arise
   - Environment variables missing
   - Local Supabase connection fails
   - Test failures unclear
   - Unsure about code reuse
   - Found multiple implementations
   - Authentication issues persist

Remember: Excellence through verified progress 

## Testing Framework Standards
- Use Vitest for ALL testing (unit, integration, E2E)
- Never use Jest or Playwright
- Maintain consistent test patterns
- Follow existing test structure
- Use Vitest's browser testing for E2E
- Document test architecture decisions 