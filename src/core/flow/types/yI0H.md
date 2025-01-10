# File Access Context
> CCC: This context defines file access patterns for AI assistant sessions.
> Parent: [Infrastructure Map](brain/invisible/INVISIBLE_MAP.md)

## Core Principles
1. Preserve system stability
2. Protect sacred spaces
3. Enable natural evolution
4. Maintain flow states

## Access Patterns
```yaml
file_access:
  protected_paths:
    - /home/jon/workspace/gauntlet/*
    - /home/jon/brain/*
    - /home/jon/.local/share/gauntlet/*
    - /home/jon/Documents/gauntlet/*
    - /home/jon/.config/gauntlet/*
    
  safe_automation:
    - package_caches
    - build_artifacts
    - system_logs
    - temp_files
    - non_critical_caches
    
  validation_rules:
    - verify_paths_before_cleanup
    - backup_before_structural_changes
    - test_automation_in_safe_areas
    - monitor_system_resources
    - preserve_work_context
```

## Implementation
```bash
# Core paths to protect
WORKSPACE="/home/jon/workspace/gauntlet"
BRAIN_DIR="/home/jon/brain"
CONFIG_DIR="/home/jon/.config/cursor"
LOCAL_STATE="/home/jon/.local/state/cursor"
LOCAL_SHARE="/home/jon/.local/share/cursor"

# Validation commands
function validate_paths() {
  for path in $WORKSPACE $BRAIN_DIR $CONFIG_DIR $LOCAL_STATE $LOCAL_SHARE; do
    ls -la $path || echo "Missing: $path"
  done
}

function check_permissions() {
  find $WORKSPACE $BRAIN_DIR -type f -exec ls -l {} \;
}

function verify_backups() {
  ls -la $LOCAL_SHARE/backups/
}
```

## Integration Points
1. **Context Loading**
   - Loaded first in context chain
   - Applied to all sessions
   - Inherited by all contexts

2. **Pattern Integration**
   - Enforces access patterns
   - Protects sacred spaces
   - Enables safe automation

3. **Role Integration**
   - Guides AI assistants
   - Preserves boundaries
   - Maintains stability

## Warning Signs
1. **Path Issues**
   - Missing directories
   - Permission problems
   - Broken symlinks
   - Access violations

2. **Pattern Violations**
   - Unsafe automation
   - Protected path access
   - Context corruption
   - Flow disruption

3. **Integration Breaks**
   - Loading failures
   - Inheritance issues
   - Role conflicts
   - Pattern misalignment

## Recovery Actions
```bash
# Verify paths
validate_paths

# Check permissions
check_permissions

# Verify backups
verify_backups

# Reset context
source /home/jon/scripts/cursor/setup_context_services.sh --reset
```

Remember: This context establishes the foundation for safe and effective file access across all AI assistant sessions. Validate during each CCC session.
