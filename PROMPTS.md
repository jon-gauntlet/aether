# Claude A - Auth & Files Specialist

## CRITICAL FEATURES (25-30% Done)
1. Auth (25% Done)
   - ✅ UI Components (SignIn, SignUp)
   - ✅ Basic validation
   - ❌ Tests Failing
     * Button states (5 tests)
     * Error validation (4 tests)
     * Session cleanup (3 tests)
     * Memory leaks (3 tests)
   - ❌ No Supabase integration
   - Must demo by 7 PM

2. Files (20% Done)
   - ✅ UI Components (FileUpload)
   - ✅ Progress indicators
   - ❌ No upload system
   - ❌ No backend integration
   - ❌ Tests not written
   - Must demo by 7 PM

## IMMEDIATE FOCUS (4:22-5:15 PM)
1. Fix Auth Tests (30min)
   ```bash
   # Clear cache first
   rm -rf node_modules/.vite node_modules/.vitest

   # Fix button tests first
   npx vitest run "button.*auth" --no-isolate --no-file-parallelism

   # Then error validation
   npx vitest run "error.*auth" --no-isolate --no-file-parallelism

   # Then session & cleanup
   npx vitest run "session.*auth" --no-isolate --no-file-parallelism
   ```
   - Fix in order listed above
   - Run with performance flags
   - Verify each fix

2. Core Auth (25min)
   - Supabase client setup
   - Session management
   - Error handling
   - Basic auth flow

## Phase 2 (5:15-6:00 PM)
1. File System
   ```bash
   # Run as you build
   npx vitest run "file" --no-isolate
   npx vitest run "upload" --no-isolate
   ```
   - Upload to Supabase
   - Progress tracking
   - Error handling
   - Write tests first

2. Integration
   ```bash
   # Verify coverage
   npx vitest run --coverage --no-isolate
   ```
   - Auth flow complete
   - File system working
   - All tests passing
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
   # Final checks
   npx vitest run --coverage --no-isolate
   ```
   - Final deploy
   - Smoke test
   - Demo ready

## Emergency Rules
1. Tests First
   - Fix failing tests
   - Write tests before features
   - Keep them passing

2. Demo Ready
   - Every feature testable
   - Every feature documented
   - Error handling solid

3. Keep Shipping
   - Commit often
   - Deploy often
   - Fix forward

## Test Commands
```bash
# 🧹 First Step
rm -rf node_modules/.vite node_modules/.vitest   # Clear cache

# 🚀 Fastest Commands
npx vitest run Auth.test.jsx --no-isolate --no-file-parallelism      # Single file
npx vitest run "auth" --no-isolate --no-file-parallelism            # Pattern match
npx vitest run --coverage --no-isolate                              # Coverage

# 🎯 Specific Tests
npx vitest run "button" --no-isolate      # Button tests
npx vitest run "error" --no-isolate       # Error tests
npx vitest run "session" --no-isolate     # Session tests
```

## Speed Configuration
```javascript
// vitest.config.js
export default {
  test: {
    isolate: false,
    threads: true,
    pool: 'threads',
    minThreads: 8,
    maxThreads: 16,
    fileParallelism: false,
    css: false,
    concurrent: 10
  }
}
```

## Speed Tips
1. Use direct `vitest run` commands
2. Add performance flags for faster runs
3. Target specific files/patterns
4. Use `.only` for focused tests
5. Clear cache if tests get slow:
   ```bash
   rm -rf node_modules/.vite
   rm -rf node_modules/.vitest
   ```

## Common Commands
```bash
# 🧹 Clear Test Cache
rm -rf node_modules/.vite node_modules/.vitest

# 🚀 Run All Auth Tests Fast
npx vitest run "auth" --no-isolate --no-file-parallelism

# 🎯 Debug Single Test File
npx vitest run Auth.test.jsx --no-isolate --no-file-parallelism

# 📊 Fast Coverage Report
npx vitest run --coverage --no-isolate
```
