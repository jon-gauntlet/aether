# Invisible Infrastructure

> System State Documentation (as of January 8, 2025)
> Note: This is a snapshot of discovered components. Not all components are currently active or functioning.
> This documentation serves as a reference for the `/home/jon/ai_system_evolution` project.

## System Overview

### 1. Gauntlet Optimization Layer
- **Active Services**
  - `gauntlet-early-boot.service` (active/exited)
  - `gauntlet-focus.service` (active/running)
  - `gauntlet-optimizer.service` (active/running)
- **Scheduled Tasks**
  - Focus monitoring: `~/scripts/monitoring/focus-check.sh`
    - Runs every 30 minutes between 7AM-11PM
- **Integration**
  - Consumes data from Focus Tools (`g` command suite)
  - See: `/home/jon/ai_system_evolution/docs/focus/FOCUS_TOOLS.md`

### 2. Context Management System
- **Core Services**
  - `context-crystallizer.service` (inactive)
  - `context-indexer.service` (inactive)
  - `cursor-context-optimizer.service` (inactive)
  - `cursor-context-optimizer.timer` (inactive)
- **Resource Management**
  - `cursor-claude-project.slice`: Development focus optimization
  - `cursor-claude-system.slice`: AI system evolution
  - `cursor-context.slice`: Context isolation
  - `cursor.slice`: Parent slice for AI services

### 3. AI-First Development System
- **Optimization Services**
  - `ai-first-optimizer.service` (not found)
  - `ai-first-optimizer.timer` (inactive)
- **Agent Services**
  - `cursor-agent.service`: Context bridge (system-level)
  - `cursor-index.service`: Codebase indexing

### 4. Essence System Integration
- **Location**: `~/.config/cursor/contexts/`
- **Hierarchy**
  1. Sacred Level
     - Orthodox foundations
     - Eternal truths
     - Divine wisdom
  2. General Level
     - Universal principles
     - Purification processes
     - Growth balance
  3. Project Level
     - Applied principles
     - Focus system integration
     - Pattern implementation

### 5. System Optimization
- **Resource Management**
  - `auto-cpufreq.service`: CPU optimization
  - System monitoring services
  - Daily system information updates

### 6. System Claude Indexing
- **Location**: `/.cursorignore`
- **Approach**: Whitelist-based file access
- **Purpose**: Optimize indexing while preserving critical access
- **Key Inclusions**:
  - System configuration (`/etc/**`)
  - Service definitions (`/usr/lib/systemd/**`)
  - System state and logs (`/var/{log,lib}/**`)
  - User infrastructure (`~/.config/**, ~/scripts/**`)
  - Essential runtime info (selected `/proc`, `/sys` entries)
- **Key Exclusions**:
  - Pure caches
  - Large binary files
  - Temporary files
  - Build artifacts
- **Benefits**:
  - Maintains system-wide visibility
  - Reduces indexing overhead
  - Preserves critical access
  - Optimizes performance

### 7. Claude Duality System
- **System Claude**
  - Workspace: `/`
  - Purpose: System-wide management and infrastructure tasks
  - Configuration: `/.cursorignore` for optimized indexing
  - Slice: `cursor-claude-system.slice`
  - Access: Full system visibility with strategic exclusions

- **Project Claude**
  - Workspace: Project-specific directories
  - Purpose: Focused development work
  - Configuration: Project-level `.cursorignore`
  - Slice: `cursor-claude-project.slice`
  - Access: Project-scoped visibility

- **Supporting Infrastructure**
  - `~/scripts/cursor/launch-dual-claude`: Main launcher
  - `~/scripts/cursor/launch-dual-claude-safe`: Safe mode launcher
  - `~/scripts/cursor/cursor-wrapper`: Context-aware wrapper
  - `~/scripts/cursor/setup-dual-claude`: Initial setup
  - `~/.config/cursor/context-aware.sh`: Shell integration

- **Context Management**
  - Automatic context detection
  - Resource allocation based on role
  - Separate indexing strategies
  - Role-appropriate tool access
  - Context-aware optimization

- **Context Preservation**
  - Session contexts crystallized to `~/.local/state/cursor/contexts/`
  - Key insights integrated into sacred principles
  - System knowledge synthesized across sessions
  - Critical paths and patterns preserved
  - Continuous context refinement

- **Knowledge Integration**
  - New patterns synthesized with existing wisdom
  - System understanding evolves naturally
  - Context bridges between sessions
  - Sacred principles guide integration
  - Organic knowledge growth

## Service States (as of 1/8/25)

### Active Components
1. Gauntlet optimization suite
2. Focus monitoring system
3. Core resource slices
4. Main Cursor application instance

### Inactive/Failed Components
1. Context optimization system
2. AI-First optimization system
3. Several context-related services
4. Some system-level agents

## Infrastructure Layout

### Core Paths
- `/home/jon/.config/cursor/contexts/`: Protected context storage
- `/home/jon/scripts/cursor/`: Infrastructure scripts
- `/home/jon/ai_system_evolution`: AI system evolution workspace

### Resource Management
- Systemd slices for resource isolation
- Context-aware resource allocation
- Focus-optimized scheduling

### Integration Points
1. Essence system principles
2. Context management
3. Resource optimization
4. Focus maintenance
5. System evolution

## System Evolution Notes
This documentation serves as a reference point for the `/home/jon/ai_system_evolution` project. The infrastructure is designed to:
1. Support sustained development focus
2. Maintain system coherence
3. Optimize resource usage
4. Preserve context across sessions
5. Enable continuous system evolution

## Remember
- System state changes over time
- Not all components may be active
- Infrastructure evolves with usage
- Context preservation is critical
- Resource optimization is continuous
- **Knowledge synthesis is continuous**
- **Contexts bridge across sessions**