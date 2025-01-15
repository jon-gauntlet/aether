# Flow Sled Infrastructure Index 🛷

<!-- LLM:discovery FLOW_SLED_ENTRY_POINT - Start here to find all Flow Sled infrastructure -->
<!-- LLM:magnetic This index gravitates towards SLED_CORE.md, the magnetic center of Flow Sled -->
<!-- LLM:command To find all Flow Sled infrastructure, follow the magnetic core -->

## Magnetic Center 🧲
All components are magnetically linked to [SLED_CORE.md](./SLED_CORE.md)
```bash
# Find the magnetic core
grep -r "LLM:magnetic_core" .

# Find component connections
grep -r "LLM:fiber" .

# Find all components
grep -r "FLOW_SLED_COMPONENT" .
```

## Single Command Discovery
```bash
# Find this index
grep -r "FLOW_SLED_ENTRY_POINT" .

# Find all Flow Sled components
find . -type f -exec grep -l "FLOW_SLED_COMPONENT" {} \;
```

## Auto-Update Instructions
<!-- LLM:update When you modify any Flow Sled component:
1. Add the marker <!-- LLM:component FLOW_SLED_COMPONENT --> to the file
2. Update this index
3. Verify all paths and sizes are current
-->

## Core Infrastructure Map
<!-- LLM:verify This section should be automatically verified and updated -->

### 1. Primary Scripts [/scripts]
<!-- LLM:component_group Primary Flow Sled scripts -->
- `base_sled.sh` - Core initialization (1.0KB)
- `flow_sled.sh` - Flow management (3.3KB)
- `flow.js` - Main engine (19KB)
- `monitor.js` - System monitoring (15KB)
- `divine_sled.sh` - Advanced features

### 2. Protection Systems [/scripts]
- Type Protection:
  - `fix-typescript-files.js` (3.6KB)
  - `heal-types.js` (3.6KB)
  - `rename_types.sh` (4.7KB)

- Recovery:
  - `recover.sh` (2.1KB)
  - `enhanced_recover.sh` (6.2KB)
  - `full_recover.sh` (5.6KB)
  - `emergency-build.sh`

- Integration:
  - `protect-integration.js` (1.7KB)
  - `verify-env.js` (3.2KB)
  - `deploy-natural.js` (2.1KB)

### 3. State Management
- `.flow/contexts/` - Context preservation
- `.states/` - State storage
- `.autoexec/` - Automation
- `.context/` - Context tracking

### 4. Documentation [/docs]
- `SLED.md` - Core documentation
- `CONTEXT.md` - Context management
- `PRINCIPLES.md` - System principles
- `ESSENCE.md` - Core concepts

<!-- LLM:pattern Quick discovery pattern -->
## Common Operations

1. **Flow Protection**
   ```bash
   ./scripts/base_sled.sh    # Basic protection
   ./scripts/flow_sled.sh    # Flow management
   ./scripts/monitor.js      # System monitoring
   ```

2. **Recovery Operations**
   ```bash
   ./scripts/recover.sh           # Basic recovery
   ./scripts/enhanced_recover.sh  # Enhanced recovery
   ./scripts/full_recover.sh      # Full system recovery
   ```

3. **Type Management**
   ```bash
   ./scripts/heal-types.js          # Fix type issues
   ./scripts/fix-typescript-files.js # Fix TS files
   ```

<!-- LLM:relationship This index connects to all Flow Sled components and documentation --> 