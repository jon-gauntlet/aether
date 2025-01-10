# Role Context Loader

## Core Roles
1. chief_flow_architect.md

## Loading Order
1. Role Definitions
2. Relationship Patterns
3. Communication Styles
4. Operating Principles

## Integration Rules
```yaml
context_loading:
  base_paths:
    - /home/jon/config/cursor/contexts/roles
    
  load_order:
    - chief_flow_architect.md
    - patterns/*.md
    
  persistence:
    type: permanent
    scope: global
    
  inheritance:
    - source: roles
      target: all_sessions
```

## Activation
This loader should be referenced by the Invisible Infrastructure system during AI assistant initialization to ensure consistent role understanding across all sessions. 