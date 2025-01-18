# Feature Migration Plan

## Features to Move

### AI Features (Turtle 2+)
- RAG system from `src/rag_aether/ai/rag_system.py`
- Document ingestion from ChatContainer.jsx
- Vector search implementation
- Claude integration (keeping basic chat for now)

### Advanced Chat (Later Turtles)
- Complex channel management
- Advanced file handling
- Rich message formatting
- Advanced threading

## Migration Steps

### Phase 1: Documentation
- [ ] Document each feature's purpose and dependencies
- [ ] Create integration guides for future use
- [ ] Map dependencies between features

### Phase 2: Safe Movement
- [ ] Copy files to new structure (don't move yet)
- [ ] Update imports in copied files
- [ ] Test in isolation
- [ ] Document any issues found

### Phase 3: Clean Core
- [ ] Identify core chat features needed now
- [ ] Ensure they work independently
- [ ] Remove advanced feature calls
- [ ] Keep simple interfaces

### Phase 4: Verification
- [ ] Test core features still work
- [ ] Verify advanced features are preserved
- [ ] Check no regressions
- [ ] Update documentation

## Current Status
- Created directory structure
- Documented purpose
- Planning feature movement

## Notes
- Don't delete any code
- Keep working features working
- Document everything
- Test before and after each step 