# Extended File Access Context

## Core Principles
1. **Trust-Based Access**
   - User-provided paths are explicitly trusted
   - Security boundaries are user-defined
   - Permission inheritance across sessions

2. **Workspace Transcendence**
   - Access beyond current workspace
   - Consistent cross-project capabilities
   - Path-agnostic operations

3. **Context Preservation**
   - Remember permitted paths
   - Maintain access patterns
   - Cross-session consistency

## Implementation

### Permitted Path Patterns
```yaml
permitted_paths:
  - /home/jon/config/cursor/**
  - /home/jon/.config/**
  - /home/jon/projects/**
  - ${WORKSPACE_ROOT}/**
```

### Access Rules
```yaml
rules:
  - pattern: /home/jon/config/cursor/**
    operations: [read, write, create, delete]
    require_confirmation: false
    
  - pattern: /home/jon/.config/**
    operations: [read, write]
    require_confirmation: true
    
  - pattern: ${WORKSPACE_ROOT}/**
    operations: [read, write, create, delete]
    require_confirmation: false
```

### Context Integration
```yaml
context_inheritance:
  - source: file_access_context
    target: all_sessions
    scope: global
    persistence: permanent
```

## Usage Patterns

1. **Direct Access**
   ```typescript
   // Access is permitted when path is explicitly provided
   edit_file("/home/jon/config/cursor/contexts/patterns/example.md")
   ```

2. **Pattern Matching**
   ```typescript
   // Access is permitted when path matches allowed patterns
   read_file("/home/jon/config/**/*.md")
   ```

3. **Cross-Project Access**
   ```typescript
   // Access maintains consistency across different project workspaces
   edit_file("/home/jon/config/shared/patterns.md")
   ```

## Security Considerations

1. **User Control**
   - All permissions are user-defined
   - Explicit paths take precedence
   - Confirmation required for sensitive operations

2. **Pattern Safety**
   - No system directory access
   - No root directory access
   - Protected path validation

3. **Operation Safety**
   - Read operations are permissive
   - Write operations require pattern match
   - Delete operations require explicit permission

## Integration

This context should be loaded by the Invisible Infrastructure system and applied to all AI assistant sessions. It establishes consistent file access patterns that persist across different project workspaces while maintaining user control over security boundaries. 