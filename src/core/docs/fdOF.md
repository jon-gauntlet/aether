# Sacred Cursor Protection Principles

## Core Principle
Cursor is the primary development tool and debugging interface. Its availability and reliability must be protected at all costs.

## Protection Rules

### 1. Availability Protection
- Never kill all Cursor instances simultaneously
- Maintain at least one working Cursor window at all times
- Preserve ability to launch Cursor from command line
- Keep UI launcher functional
- Protect against accidental global process kills

### 2. Process Management
```typescript
interface CursorProcessRule {
  minInstances: 1;              // Always keep at least one instance
  killPattern: "selective";     // Never use broad process kills
  restartStrategy: "rolling";   // Restart one at a time
  safetyChecks: "required";     // Verify before any process operations
}
```

### 3. Service Integration
```typescript
interface CursorServiceRule {
  type: "enhancement";          // Services enhance, never replace
  fallback: "commandline";      // CLI must always work
  isolation: "required";        // Services can't affect core functionality
  recovery: "automatic";        // Self-healing without user intervention
}
```

## Implementation Guidelines

### 1. Process Operations
- Verify existing instances before operations
- Use specific process targeting
- Implement rolling updates
- Maintain fallback paths
- Protect parent processes

### 2. Service Design
- Enhance don't replace
- Maintain independence
- Preserve core paths
- Enable safe recovery
- Protect configurations

### 3. Debugging Protection
- Preserve debug capabilities
- Maintain log access
- Keep error reporting
- Enable safe inspection
- Protect debug paths

## Critical Paths

### 1. Launch Methods
```bash
# Must Always Work
/usr/bin/cursor           # Binary
cursor                    # Command line
~/.local/share/applications/cursor.desktop  # UI launcher
```

### 2. Debug Paths
```bash
# Must Remain Accessible
~/.local/share/cursor/logs/
~/.config/cursor/
/tmp/cursor-*
```

### 3. Recovery Paths
```bash
# Must Stay Functional
~/.local/bin/cursor
~/.config/systemd/user/cursor*
/usr/share/cursor/
```

## Integration Rules

### 1. Service Development
- Services must be optional
- Core functionality preserved
- Independent operation
- Safe failure modes
- Automatic recovery

### 2. Process Management
- Specific targeting only
- Verify before action
- Rolling operations
- Fallback preservation
- State protection

### 3. Enhancement Pattern
- Add don't modify
- Preserve core paths
- Maintain independence
- Enable recovery
- Protect function

## Remember

Cursor is not just a tool - it's the primary interface for development, debugging, and system interaction. Its protection is sacred. All changes must enhance without risking core functionality. When in doubt, protect Cursor's availability above all else.

## Implementation Notes

### 1. Process Verification
```bash
# Always check before operations
if pgrep -f "cursor" >/dev/null; then
    # At least one instance exists
    # Safe to proceed with careful operations
fi
```

### 2. Safe Shutdown
```bash
# Never force kill
systemctl --user stop cursor-service || true
# Wait for graceful shutdown
sleep 2
```

### 3. Recovery Check
```bash
# Verify recovery path
if ! command -v cursor >/dev/null; then
    # Critical failure
    # Immediate recovery required
fi
```

## Protection Patterns

### 1. Service Pattern
```typescript
interface CursorService {
  independent: true;      // No core dependencies
  optional: true;        // Can be disabled
  recoverable: true;     // Self-healing
  protected: true;       // Core paths preserved
}
```

### 2. Process Pattern
```typescript
interface CursorProcess {
  verified: true;        // Check before action
  specific: true;        // No broad operations
  preserved: true;       // Maintain availability
  recoverable: true;     // Enable restoration
}
```

### 3. Enhancement Pattern
```typescript
interface CursorEnhancement {
  additive: true;        // Never replace
  independent: true;     // Stand-alone
  protected: true;       // Core preserved
  recoverable: true;     // Self-healing
}
``` 