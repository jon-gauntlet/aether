# Claude A - Auth & Files Specialist

## CRITICAL FEATURES (25-30% Done)
1. Auth (25% Done)
   - ✅ UI Components
   - ✅ Basic validation
   - ❌ 15 failing tests
     * Button states
     * Error validation
     * Session cleanup
   - ❌ No Supabase integration
   - Must demo by 7 PM

2. Files (20% Done)
   - ✅ UI Components
   - ✅ Progress UI
   - ❌ No upload system
   - ❌ No backend integration
   - ❌ No tests
   - Must demo by 7 PM

## IMMEDIATE FOCUS (4:22-5:15 PM)
1. Fix Auth Tests (30min)
   ```bash
   # Run only auth tests
   npm test -- "auth" --run
   
   # Target specific failures
   npm test -- "button.*auth" --run  # Button states
   npm test -- "error.*auth" --run   # Error validation
   npm test -- "session.*auth" --run # Session cleanup
   
   # Single file focus
   npm test -- "Auth.test" --run
   ```
   - Fix button states first
   - Then error validation
   - Then session cleanup
   - Run coverage after fixes

2. Core Auth (25min)
   - Supabase client
   - Session handling
   - Error states
   - Basic flow

## Phase 2 (5:15-6:00 PM)
1. File System
   ```bash
   # Run file tests as you build
   npm test -- "file" --run
   npm test -- "upload" --run
   ```
   - Upload to Supabase
   - Progress tracking
   - Error handling
   - Basic tests

2. Integration
   ```bash
   # Verify full coverage
   npm test -- --coverage
   ```
   - Auth flow complete
   - File system working
   - Tests passing
   - Coverage report

## Phase 3 (6:00-7:00 PM)
1. Polish (6:00-6:30)
   - Error messages
   - Loading states
   - Success feedback
   - User guidance

2. Integration (6:30-6:45)
   - Merge with WebSocket
   - Fix conflicts
   - Test flows
   - Document APIs

3. Production (6:45-7:00)
   ```bash
   # Final verification
   npm test -- --run --coverage
   ```
   - Final deploy
   - Smoke test
   - Demo ready

## Emergency Rules
1. Tests First
   - Fix failing tests
   - Then add features
   - Keep them passing

2. Demo Ready
   - Every feature testable
   - Every feature documented
   - Error handling solid

3. Keep Shipping
   - Commit often
   - Deploy often
   - Fix forward

## Verification
Each feature needs:
1. Passing tests
2. Error handling
3. Documentation
4. Coverage report

## Test Commands
```bash
# Fastest Commands (Use These!)
npx vitest run Auth.test.jsx        # Single file
npx vitest run "auth"               # Pattern match
npx vitest run --coverage           # Coverage report

# Specific Tests
npx vitest run "button"             # Button tests
npx vitest run "error"              # Error tests
npx vitest run "session"            # Session tests

# Watch Mode (Only if Needed)
npx vitest watch Auth.test.jsx      # Watch single file
npx vitest watch "auth"             # Watch pattern
```

## Speed Tips
1. Use `vitest run` instead of `npm test`
2. Target specific files/patterns
3. Only use watch mode when needed
4. Add `.only` to focus on specific tests
