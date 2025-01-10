# Context Loader Configuration
> CCC: This loader manages context loading for all AI assistant sessions.
> Parent: [Infrastructure Map](brain/invisible/INVISIBLE_MAP.md)

## Core Contexts
1. file_access_context.md - File access patterns
2. patterns/ai_first_autonomic.md - Core AAA patterns
3. patterns/invisible_infrastructure.md - Infrastructure patterns
4. roles/chief_flow_architect.md - Flow orchestration

## Loading Order
1. Base Infrastructure
2. File Access Rules
3. Pattern Libraries
4. Role Definitions
5. Project-Specific Contexts

## Integration Rules
```yaml
context_loading:
  base_paths:
    - /home/jon/.config/cursor/contexts
    - ${WORKSPACE_ROOT}/.context
    
  load_order:
    - file_access_context.md
    - patterns/*.md
    - roles/*.md
    - ${WORKSPACE_ROOT}/.context/*.md
    
  persistence:
    type: permanent
    scope: global
    
  inheritance:
    - source: file_access_context
      target: all_sessions
    - source: patterns
      target: all_sessions
    - source: roles
      target: all_sessions
```

## Activation
This loader should be referenced by the Invisible Infrastructure system during AI assistant initialization to ensure consistent context loading across all sessions.

## Persistence Validation
To validate persistence:
```bash
# Check core paths
ls -la /home/jon/.config/cursor/contexts/roles
ls -la /home/jon/.config/cursor/contexts/patterns

# Verify key files
cat /home/jon/.config/cursor/contexts/roles/chief_flow_architect.md
cat /home/jon/.config/cursor/contexts/patterns/invisible_infrastructure.md

# Test inheritance
source /home/jon/scripts/cursor/setup_context_services.sh
```

## Warning Signs
1. Missing context files
2. Broken inheritance chains
3. Load order violations
4. Persistence failures

## Recovery Actions
```bash
# Restore core files
cp -r /home/jon/.local/share/cursor/backups/contexts/* /home/jon/.config/cursor/contexts/

# Reset services
source /home/jon/scripts/cursor/setup_context_services.sh --reset

# Verify state
ls -la /home/jon/.local/state/cursor/context
cat /home/jon/.local/share/cursor/essence/context.cache
```

Remember: The loader is the foundation of the Invisible Infrastructure. Validate all paths and relationships during CCC sessions.
