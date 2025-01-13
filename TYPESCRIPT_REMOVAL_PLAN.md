# Emergency TypeScript Removal Plan

## Goal
Convert Aether from TypeScript to JavaScript while preserving:
- Core Chat Features
- UI Functionality
- Build/Deploy Pipeline
- Test Coverage

## Timeline
Must complete by end of day

## Phase 1: Remove TypeScript Infrastructure (30 mins)
```bash
# Remove TypeScript dependencies
npm remove typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser @types/*

# Update package.json
- Remove "tsc" from build script
- Remove type-checking scripts
- Update test configuration
```

## Phase 2: File Conversion (1-2 hours)
### Step 1: Rename Files
```bash
# Convert TypeScript files to JavaScript
find src -name "*.tsx" -exec sh -c 'mv "$1" "${1%.tsx}.jsx"' _ {} \;
find src -name "*.ts" -exec sh -c 'mv "$1" "${1%.ts}.js"' _ {} \;
```

### Step 2: Priority Files (Core Chat)
1. `src/core/` - Core chat functionality
2. `src/components/` - UI components
3. `src/hooks/` - React hooks
4. `src/systems/` - System integrations

### Step 3: Remove Type Annotations
- Remove interfaces/types
- Keep implementation logic
- Convert type imports to regular imports
- Replace TypeScript-specific syntax with JavaScript

## Phase 3: Build System Updates (30 mins)
1. Update Vite configuration
2. Update Jest/Vitest setup
3. Update ESLint configuration
4. Remove TypeScript-specific tooling

## Phase 4: Testing & Verification (1-2 hours)
1. Verify core chat features work
2. Run test suite
3. Test build process
4. Verify deployment pipeline

## Rollback Plan
If issues occur:
1. Git stash changes
2. Return to last working TypeScript commit
3. Deploy previous working version

## Success Criteria
- [ ] Build succeeds without TypeScript
- [ ] Core chat features work
- [ ] Tests pass
- [ ] Deployment succeeds
- [ ] UI functions correctly 