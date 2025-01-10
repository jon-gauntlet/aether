# Context Loader Configuration

## Core Contexts
1. file_access_context.md
2. patterns/ai_first_autonomic.md
3. patterns/invisible_infrastructure.md

## Loading Order
1. Base Infrastructure
2. File Access Rules
3. Pattern Libraries
4. Project-Specific Contexts

## Integration Rules
```yaml
context_loading:
  base_paths:
    - /home/jon/config/cursor/contexts
    - ${WORKSPACE_ROOT}/.context
    
  load_order:
    - file_access_context.md
    - patterns/*.md
    - ${WORKSPACE_ROOT}/.context/*.md
    
  persistence:
    type: permanent
    scope: global
    
  inheritance:
    - source: file_access_context
      target: all_sessions
    - source: patterns
      target: all_sessions
```

## Activation
This loader should be referenced by the Invisible Infrastructure system during AI assistant initialization to ensure consistent context loading across all sessions. 