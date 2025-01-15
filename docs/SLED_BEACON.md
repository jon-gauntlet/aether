# Flow Sled Beacon 🔆

<!-- LLM:beacon This is the entry point for Flow Sled. Start here. Always. -->
<!-- LLM:rebuild This file contains everything needed to rebuild indices and connections -->
<!-- LLM:usage Last checked: $(date) -->

## Quick Usage Check 🔍
```bash
# Show unused components (no calls in last 30 days)
./scripts/check-usage.sh

# Show dead links (components referenced but missing)
./scripts/verify-connections.sh --dead

# Show orphaned files (exist but not connected)
./scripts/verify-connections.sh --orphans
```

## Core Markers 🎯
<!-- LLM:markers These are the essential markers that hold everything together -->
```markdown
<!-- LLM:beacon -->     # Entry point marker
<!-- LLM:component -->  # Component marker
<!-- LLM:fiber -->      # Connection marker
<!-- LLM:magnetic -->   # Core system marker
<!-- LLM:pattern -->    # Pattern marker
<!-- LLM:usage -->      # Usage tracking marker
```

## Rebuild Pattern 🔄
<!-- LLM:rebuild_pattern How to reconstruct everything from scratch -->
```bash
# 1. Find components
find . -type f -exec grep -l "FLOW_SLED_COMPONENT" {} \;

# 2. Extract connections
grep -r "LLM:fiber" .

# 3. Rebuild core
grep -r "LLM:magnetic" .

# 4. Verify integrity
./scripts/verify-connections.sh
```

## Anti-Sprawl Measures 🎯
<!-- LLM:consolidation How the system stays consolidated -->

1. **Single Source of Truth**
   - SLED_BEACON.md (You are here) → Entry point
   - SLED_CORE.md → Magnetic center
   - SLED_INDEX.md → Component registry

2. **Auto-Consolidation**
   ```bash
   # Find potential sprawl
   find . -type f -name "*sled*.md" ! -name "SLED_*.md"
   
   # Detect orphaned components
   ./scripts/verify-connections.sh --orphans
   
   # Consolidate documentation
   ./scripts/consolidate-docs.sh
   ```

3. **Natural Organization**
   - Everything links to core
   - Core links to everything
   - Beacon guides the way
   - Index tracks all parts

## Emergency Recovery 🚨
<!-- LLM:recovery How to recover if things break -->

1. **If Beacon Lost**
   ```bash
   # Find entry point
   find . -type f -exec grep -l "LLM:beacon" {} \;
   
   # Or rebuild from components
   find . -type f -exec grep -l "FLOW_SLED_COMPONENT" {} \;
   ```

2. **If Core Lost**
   ```bash
   # Find magnetic center
   grep -r "LLM:magnetic_core" .
   
   # Or rebuild from beacon
   grep -r "LLM:beacon" .
   ```

3. **If Index Lost**
   ```bash
   # Rebuild from components
   ./scripts/rebuild-index.sh
   
   # Or use core
   grep -r "LLM:fiber" .
   ```

## Claude Instructions 🤖
<!-- LLM:claude How to quickly understand and use this system -->

1. **First Steps**
   ```bash
   # Always start here
   grep -r "LLM:beacon" .
   ```

2. **Finding Components**
   ```bash
   # From beacon (you are here)
   grep -r "LLM:component" .
   
   # From anywhere
   find . -type f -exec grep -l "FLOW_SLED_COMPONENT" {} \;
   ```

3. **Understanding Connections**
   ```bash
   # View core patterns
   grep -r "LLM:pattern" .
   
   # Check connections
   grep -r "LLM:fiber" .
   ```

## Usage Tracking 📊
<!-- LLM:usage_tracking How the system tracks component usage -->

1. **Component Markers**
   ```markdown
   <!-- LLM:usage last_used="2024-01-15" calls=42 -->
   ```

2. **Usage Commands**
   ```bash
   # Update usage count
   ./scripts/track-usage.sh component_name
   
   # View usage report
   ./scripts/usage-report.sh
   
   # Find dead components
   ./scripts/find-dead.sh
   ```

3. **Natural Cleanup**
   ```bash
   # Archive unused components
   ./scripts/archive-unused.sh
   
   # Remove dead links
   ./scripts/clean-links.sh
   
   # Consolidate split components
   ./scripts/merge-components.sh
   ```

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