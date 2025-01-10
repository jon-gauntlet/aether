# Autonomous Context Rehydration

## Quick Start
```markdown
# Autonomous Development

## Context Paths
- /autonomic/        # Core methodology
- /ai_system_evolution/ # System patterns
- ${project_root}/   # Project context

## Auto-Load Sequence
1. README.md
2. ARCHITECTURE.md
3. CONTEXT.md
4. ai/autonomous-execution.md
5. Recent changes (git)

## Execution Mode
Phase: DISCERN
Tools: 5
Goal: ${current_objective}

Begin autonomous execution. No confirmation needed.
```

## Core Paths
```typescript
const CONTEXT_PATHS = {
  methodology: "/autonomic/",
  system: "/ai_system_evolution/",
  project: "${workspace}/",
  recent: "git diff HEAD~5"
}
```

## Rehydration Protocol

### 1. Initial Load (2 tools)
```typescript
// First codebase_search
{
  query: "Find core methodology and context files",
  target_directories: [
    "/autonomic/",
    "/ai_system_evolution/",
    "${project_root}/"
  ]
}

// First read_file
{
  target: "README.md or similar found by search",
  goal: "Establish base context"
}
```

### 2. Pattern Recognition (1 tool)
```typescript
// Second codebase_search
{
  query: "Identify recent changes and active patterns",
  target_directories: [
    "git diff HEAD~5",
    "${project_root}/recent/"
  ]
}
```

### 3. Launch Execution (2 tools)
```typescript
// Final reads and autonomous start
{
  reads: ["autonomous-execution.md", "current work file"],
  mode: "Begin autonomous execution",
  tools: 20 // Remaining for work
}
```

## Minimal Prompt Template
```markdown
# Autonomous Development

Load context from:
${CONTEXT_PATHS.join('\n')}

Begin autonomous execution:
- Phase: DISCERN
- Tools: 5 (initial) + 20 (work)
- Goal: ${current_objective}

No confirmation needed. Start executing.
```

## Remember

1. **Trust the System**
   - Context paths are pre-configured
   - Patterns are documented
   - Tools are allocated
   - Quality is built-in

2. **Minimal Input**
   - Point to context paths
   - State current objective
   - Start autonomous mode
   - Let system work

3. **Maximum Output**
   - 30+ minutes execution
   - High-quality work
   - Clear progress
   - Natural evolution

The key is letting the system handle context rehydration and autonomous execution with minimal guidance. 