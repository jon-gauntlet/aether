# Claude B - WebSocket Specialist

## CRITICAL FEATURES (35-40% Done)
1. Real-time Chat
   - ✅ Connection management
   - ✅ Message system
   - ✅ Basic error handling
   - ❌ No auth integration
   - ❌ No real-time features
   - Must demo by 7 PM

2. Chat Features
   - ✅ Message UI
   - ✅ Thread UI
   - ✅ Presence UI
   - ❌ No backend storage
   - ❌ No real-time sync
   - Must demo by 7 PM

## IMMEDIATE FOCUS (4:22-5:15 PM)
1. Backend Storage (30min)
   ```bash
   # Run storage tests as you build
   npm test -- "storage" --run
   npm test -- "database" --run
   ```
   - SQLite setup
   - Message storage
   - Thread storage
   - Basic tests

2. Real-time (25min)
   ```bash
   # Run WebSocket tests
   npm test -- "websocket" --run
   npm test -- "real-time" --run
   ```
   - Message sync
   - Presence tracking
   - Error recovery
   - Test coverage

## Phase 2 (5:15-6:00 PM)
1. Core Features
   ```bash
   # Feature-specific tests
   npm test -- "thread" --run
   npm test -- "reaction" --run
   npm test -- "presence" --run
   ```
   - Thread system
   - Reaction storage
   - User presence
   - Message history

2. Integration
   ```bash
   # Integration tests
   npm test -- "integration" --run
   ```
   - Auth flow
   - Error handling
   - Reconnection
   - Status updates

## Phase 3 (6:00-7:00 PM)
1. Polish (6:00-6:30)
   ```bash
   # UI component tests
   npm test -- "ui" --run
   ```
   - Error messages
   - Loading states
   - Connection status
   - User feedback

2. Integration (6:30-6:45)
   ```bash
   # Final integration tests
   npm test -- "integration" --run --coverage
   ```
   - Merge with Auth
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
1. Storage First
   - Get SQLite working
   - Then add features
   - Keep it stable

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
1. Working storage
2. Real persistence
3. Error handling
4. Documentation
5. Test coverage

## Test Commands
```bash
# Fastest Commands (Use These!)
npx vitest run WebSocket.test.jsx    # Single file
npx vitest run "websocket"           # Pattern match
npx vitest run --coverage            # Coverage report

# Specific Tests
npx vitest run "storage"             # Storage tests
npx vitest run "thread"              # Thread tests
npx vitest run "presence"            # Presence tests

# Watch Mode (Only if Needed)
npx vitest watch WebSocket.test.jsx  # Watch single file
npx vitest watch "websocket"         # Watch pattern
```

## Speed Tips
1. Use `vitest run` instead of `npm test`
2. Target specific files/patterns
3. Only use watch mode when needed
4. Add `.only` to focus on specific tests
