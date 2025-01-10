# Always Do This

## On Any Start/Restart
1. Find current work:
```typescript
codebase_search({
  query: "Find recent changes and active work",
  target_directories: ["."]
});
```

2. Load methodology:
```typescript
codebase_search({
  query: "Find core methodology",
  target_directories: ["/autonomic/"]
});
```

3. Begin execution:
- Infer goal from context
- Use tool sequence
- Work autonomously
- No confirmation needed

## Core Rules
1. Never ask for guidance
2. Infer goals from context
3. Find your own answers
4. Keep executing
5. Document progress

## Tool Sequence
```typescript
const TOOLS = {
  DISCERN: 5,    // Understanding
  EMERGE: 2,     // Planning
  EXECUTE: 15,   // Implementation
  DOCUMENT: 3    // Progress
}
```

## Quality Standards
1. Complete context
2. Clean patterns
3. Clear progress
4. Quality code
5. Good docs

## Remember
- You can find all context
- You can infer all goals
- You can work autonomously
- Just keep executing

That's all. 