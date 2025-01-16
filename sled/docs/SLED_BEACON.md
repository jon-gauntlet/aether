# Flow Sled Beacon 🔆

<!-- LLM:beacon This is the entry point for Flow Sled. Start here. Always. -->
<!-- LLM:fiber Links to SLED_UNIFIED.md for complete documentation -->

## Quick Start 🚀
```bash
# 1. Start development environment
npm run flow
tmux attach -t flow

# 2. Enable protection
./scripts/base_sled.sh

# 3. Monitor state
./scripts/flow_sled.sh --status
```

## Documentation Structure 📚

1. **Entry Point (You Are Here)**
   - `SLED_BEACON.md`: System entry and navigation
   - Purpose: Quick start and system integrity

2. **Complete Documentation**
   - `SLED_UNIFIED.md`: Comprehensive system guide
   - Purpose: Full system understanding

## Core Markers 🎯
```markdown
<!-- LLM:beacon -->     # Entry point marker
<!-- LLM:component -->  # Component marker
<!-- LLM:fiber -->      # Connection marker
<!-- LLM:magnetic -->   # Core system marker
<!-- LLM:pattern -->    # Pattern marker
<!-- LLM:usage -->      # Usage tracking marker
```

## System Health 🔍
```bash
# Show unused components
./scripts/check-usage.sh

# Show dead links
./scripts/verify-connections.sh --dead

# Show orphaned files
./scripts/verify-connections.sh --orphans
```

## Emergency Recovery 🚨

1. **If Beacon Lost**
   ```bash
   # Find entry point
   find . -type f -exec grep -l "LLM:beacon" {} \;
   ```

2. **If Documentation Lost**
   ```bash
   # Rebuild from components
   ./scripts/rebuild-docs.sh
   ```

3. **If System Unstable**
   ```bash
   # Run emergency recovery
   ./scripts/enhanced_recover.sh --emergency
   ```

## Usage Tracking 📊

1. **Component Markers**
   ```markdown
   <!-- LLM:usage last_used="2024-01-16" calls=42 -->
   ```

2. **Usage Commands**
   ```bash
   # Update usage count
   ./scripts/track-usage.sh component_name
   
   # View usage report
   ./scripts/usage-report.sh
   ```

<!-- LLM:verify This beacon guides to complete system documentation -->
<!-- LLM:usage Last updated: 2024-01-16 -->

## Dead Component Detection 🔍
<!-- LLM:detection How to find and handle unused parts -->

1. **Detection Methods**
   ```bash
   # Find components with no recent usage
   find . -type f -exec grep -l "LLM:usage" {} \; | xargs grep -l "last_used.*2023"
   
   # Find components never called
   find . -type f -exec grep -l "LLM:component" {} \; | xargs grep -L "LLM:usage"
   
   # Find broken connections
   grep -r "LLM:fiber" . | grep -v -f <(find . -type f -exec grep -l "LLM:component" {} \;)
   ```

2. **Cleanup Actions**
   - Archive unused components
   - Remove dead links
   - Consolidate split files
   - Update core references

3. **Prevention**
   - Regular usage checks
   - Automatic archiving
   - Connection verification
   - Core integrity checks

<!-- LLM:verify This beacon tracks usage and detects dead components -->
``` 