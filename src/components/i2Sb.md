# AI System Evolution Session Bootstrap

> This document helps Claude instances quickly understand the project context and infrastructure.

## Quick Start
1. Core project documentation is in `/home/jon/ai_system_evolution/`
2. Infrastructure documentation is at `/home/jon/.config/cursor/contexts/sacred/principles/INVISIBLE_INFRASTRUCTURE.md`
3. Active services can be checked with:
   ```bash
   systemctl --user status cursor-ai.slice gauntlet-optimizer-ai.service cursor-context.slice
   ```

## Key Paths
- `/home/jon/.local/share/gauntlet/` - Metrics and state data
- `/home/jon/.local/share/cursor/` - Cursor and context data
- `/home/jon/.config/cursor/contexts/` - Context hierarchies
- `/home/jon/scripts/cursor/` - Infrastructure scripts

## Infrastructure Components
1. Context Management
   - Crystallization service
   - Context optimization
   - State preservation

2. Resource Management
   - AI-specific slice (cursor-ai.slice)
   - Context slice (cursor-context.slice)
   - Gauntlet optimizer service

3. Metrics Collection
   - System metrics
   - AI model metrics
   - Context quality metrics
   - Focus state metrics

## Integration Points
1. Gauntlet Optimizer
   - Monitors resource usage
   - Manages AI workloads
   - Preserves context quality
   - Optimizes for focus states

2. Context System
   - Preserves session context
   - Manages context hierarchies
   - Optimizes context loading
   - Handles crystallization

3. Focus Tools
   - Deep work management
   - Flow state detection
   - Resource optimization
   - Context preservation

## Current Status
- Phase 1 of AI integration complete
- Basic metrics collection active
- Resource management operational
- Context system initialized

## Next Actions
1. Monitor metrics collection
2. Implement pattern recognition
3. Enhance prediction models
4. Improve context quality assessment

## Important Notes
- System is optimized for 15GB RAM + 16GB Swap
- AI workloads are managed by cursor-ai.slice
- Context preservation is critical
- Focus states trigger resource optimization 