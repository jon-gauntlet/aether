# Zero-Interference Development in SLED 🛡️

## Core Principles

### 1. State Isolation
- All SLED state lives in `.sled/` directory
- No pollution of repository space
- Clear separation between tracking and modification
- Hierarchical state organization by component

### 2. Environment Detection Over Modification
- Environment variables are read, never exported
- Configuration files are detected, not created
- Dependencies are discovered, not installed
- Paths are tracked, not modified

### 3. Clean Test Isolation
- Tests run in dedicated SLED space
- Results stored separately from code
- Virtualenvs respected, not created
- No global test state

### 4. Non-Intrusive Monitoring
- Energy levels tracked in isolated files
- Flow state managed without environment changes
- Protection implemented through markers
- Session tracking in dedicated space

## Implementation Details

### Directory Structure
```
.sled/
├── environment/       # Environment detection
│   ├── type          # Stack type (python, etc)
│   └── verify/       # Verification timestamps
├── python/           # Python-specific state
│   ├── state/        # Environment tracking
│   ├── venv/         # Virtualenv detection
│   └── cache/        # Configuration cache
├── energy/           # Energy tracking
│   ├── level         # Current energy level
│   └── history       # Energy history
├── flow/             # Flow management
│   ├── state         # Current flow state
│   └── markers/      # Flow markers
├── test/             # Test isolation
│   ├── results/      # Test results
│   └── logs/         # Test logs
├── backup/           # State backups
│   └── TIMESTAMP/    # Point-in-time backups
└── session/          # Session tracking
    └── TIMESTAMP     # Session markers
```

### Key Components

#### 1. Environment Handler
```bash
# Detection over modification
detect_environment() {
    local env_type=""
    if [ -f "pyproject.toml" ]; then
        env_type="python"
    fi
    echo "$env_type" > "$SLED_PROJECT_DIR/.sled/environment/type"
}
```

#### 2. State Management
```bash
# Clean state handling
update_state() {
    local component=$1
    local value=$2
    local state_file="$SLED_PROJECT_DIR/.sled/$component/state"
    echo "$value" > "$state_file"
    echo "$(date +%s)" > "$state_file.timestamp"
}
```

#### 3. Test Infrastructure
```bash
# Isolated test execution
run_tests() {
    local test_dir="$SLED_PROJECT_DIR/.sled/test"
    local results_file="$test_dir/results/$(date +%Y%m%d_%H%M%S).log"
    mkdir -p "$(dirname "$results_file")"
    pytest "$@" | tee "$results_file"
}
```

## Best Practices

### 1. State Management
- Always use atomic operations for state updates
- Include timestamps with all state changes
- Keep state files small and focused
- Use clear naming conventions

### 2. Environment Handling
- Check for existence before reading
- Cache complex environment checks
- Use fallback values for missing data
- Log environment changes

### 3. Test Management
- Isolate test runs completely
- Clean up test artifacts
- Preserve test history
- Track test dependencies

### 4. Backup Strategy
- Create timestamped backups
- Remove old backups automatically
- Verify backup integrity
- Document backup contents

## Common Patterns

### 1. State Reading
```bash
read_state() {
    local component=$1
    local state_file="$SLED_PROJECT_DIR/.sled/$component/state"
    [ -f "$state_file" ] && cat "$state_file" || echo "unknown"
}
```

### 2. Safe Updates
```bash
safe_update() {
    local component=$1
    local value=$2
    local temp_file="$(mktemp)"
    echo "$value" > "$temp_file"
    mv "$temp_file" "$SLED_PROJECT_DIR/.sled/$component/state"
}
```

### 3. History Tracking
```bash
track_history() {
    local component=$1
    local value=$2
    local history_file="$SLED_PROJECT_DIR/.sled/$component/history"
    echo "$(date +%s) $value" >> "$history_file"
}
```

## Anti-Patterns to Avoid

### 1. Direct Environment Modification
❌ Don't:
```bash
export PYTHONPATH="$PROJECT_ROOT/src"
```
✅ Do:
```bash
echo "PYTHONPATH=$PROJECT_ROOT/src" > "$SLED_PROJECT_DIR/.sled/python/state/paths"
```

### 2. Global State
❌ Don't:
```bash
FLOW_STATE=1
```
✅ Do:
```bash
echo "1" > "$SLED_PROJECT_DIR/.sled/flow/state"
```

### 3. Direct File Modification
❌ Don't:
```bash
echo "config" > .env
```
✅ Do:
```bash
echo "config" > "$SLED_PROJECT_DIR/.sled/environment/detected_config"
```

## Migration Guide

### 1. State Migration
1. Identify all state files
2. Create corresponding paths in `.sled/`
3. Move state with preservation
4. Update references

### 2. Environment Cleanup
1. List all exported variables
2. Convert to detection patterns
3. Update dependent scripts
4. Verify clean environment

### 3. Test Isolation
1. Move test runners to SLED space
2. Update result storage
3. Implement clean isolation
4. Verify no interference

## Monitoring and Verification

### 1. State Verification
```bash
verify_state() {
    local component=$1
    local state_file="$SLED_PROJECT_DIR/.sled/$component/state"
    local timestamp_file="$state_file.timestamp"
    
    [ -f "$state_file" ] || return 1
    [ -f "$timestamp_file" ] || return 1
    
    local age=$(($(date +%s) - $(cat "$timestamp_file")))
    [ "$age" -lt 3600 ] || return 1
}
```

### 2. Environment Checks
```bash
check_environment() {
    local env_dir="$SLED_PROJECT_DIR/.sled/environment"
    local check_file="$env_dir/verify/$(date +%Y%m%d)"
    
    {
        echo "timestamp=$(date +%s)"
        echo "python=$(python3 --version 2>/dev/null || echo 'not found')"
        echo "poetry=$(poetry --version 2>/dev/null || echo 'not found')"
        echo "virtualenv=${VIRTUAL_ENV:-none}"
    } > "$check_file"
}
```

### 3. Interference Detection
```bash
detect_interference() {
    local check_dir="$SLED_PROJECT_DIR/.sled/verify"
    mkdir -p "$check_dir"
    
    # Check for direct environment modifications
    env | grep -E '^SLED_' > "$check_dir/env_vars"
    
    # Check for unmanaged files
    find . -maxdepth 1 -name '.sled*' ! -name '.sled' \
        > "$check_dir/unmanaged_files"
}
```

## Future Considerations

### 1. Enhanced Isolation
- Container-based test execution
- Virtual environment snapshots
- State encryption
- Secure backup storage

### 2. Advanced Monitoring
- Real-time state verification
- Automatic interference detection
- Performance impact tracking
- Resource usage monitoring

### 3. Integration Points
- CI/CD pipeline integration
- IDE plugin support
- Remote state synchronization
- Team collaboration features

<!-- LLM:verify This document provides comprehensive zero-interference guidelines -->
<!-- LLM:usage Created: 2024-01-17 -->
<!-- LLM:sled_verify Documents SLED zero-interference patterns --> 