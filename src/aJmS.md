# Rehydration Example

## Starting New Session

### 1. Minimal Prompt
```markdown
# Autonomous Development

Load and execute from:
- /autonomic/
- /ai_system_evolution/
- /projects/current/

Goal: Continue implementation of authentication system
Mode: Autonomous execution
Tools: 25 total

Begin without confirmation.
```

### 2. System Response
```markdown
Initiating context rehydration...

1. Loading methodology (2 tools):
   - codebase_search: Core methodology files
   - read_file: autonomous-execution.md

2. Loading patterns (1 tool):
   - codebase_search: Recent changes and patterns

3. Starting execution (2 tools):
   - read_file: Current work state
   - read_file: Implementation context

Remaining tools: 20
Beginning autonomous execution...
```

### 3. Autonomous Work
```markdown
Phase: DISCERN
Tools: 5/5

Understanding current state:
- Authentication system implementation
- OAuth flow integration
- Test coverage requirements
- Quality standards
- Recent changes

Transitioning to EMERGE...
```

## Example Flow

### 1. Context Loading
```typescript
// Tool 1: Find methodology
codebase_search({
  query: "Find core methodology files",
  target_directories: ["/autonomic/"]
});

// Tool 2: Load execution framework
read_file({
  path: "/autonomic/ai/autonomous-execution.md"
});

// Tool 3: Get recent context
codebase_search({
  query: "Recent authentication changes",
  target_directories: ["/projects/current/"]
});

// Tool 4-5: Load current state
read_file({
  path: "auth/current-implementation.ts"
});
read_file({
  path: "auth/test-coverage.md"
});
```

### 2. Pattern Recognition
```typescript
// Remaining tools: 20
// Phase: EXECUTE

// Implementation pattern
edit_file({
  path: "auth/oauth-flow.ts",
  changes: "Implement OAuth flow"
});

// Test coverage
edit_file({
  path: "auth/oauth-flow.test.ts",
  changes: "Add test coverage"
});

// Documentation
edit_file({
  path: "auth/README.md",
  changes: "Update documentation"
});
```

### 3. Progress Tracking
```markdown
# Progress Update
- OAuth flow implementation: 70%
- Test coverage: 85%
- Documentation: Updated
- Next: Complete OAuth integration

Continuing autonomous execution...
```

## Key Points

### 1. Minimal Input
- Point to context paths
- State clear goal
- Trust the system
- Let it work

### 2. Maximum Output
- Continuous execution
- High-quality work
- Clear progress
- Natural evolution

### 3. Success Pattern
- Clean rehydration
- Clear objective
- Trust system
- Allow autonomy
- Track progress

## Remember

The key to success is:
1. Minimal, clear prompting
2. Trust the system
3. Allow autonomy
4. Track progress
5. Stay hands-off

This enables 30+ minutes of focused, high-quality autonomous execution. 