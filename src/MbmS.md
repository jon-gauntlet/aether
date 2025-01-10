# State Tracking System

## Directory Structure
- Project-specific state: `.gauntlet/state/`
- Global state: `~/gauntlet/state/`

## Purpose
This directory maintains project-specific state tracking for critical development phases, working in conjunction with global state stored in the home directory.

## Key Files

### Project-Specific
- `90min_plan_progress.json`: Tracks progress against the 90-minute verification plan
- `evolution_tracking.json`: Tracks pattern evolution and system state
- Local symlink to `CLAUDE_CONTINUATION.md`

### Global (~/gauntlet/state/)
- `CLAUDE_CONTINUATION.md`: Core continuation context and directives

## File Structures

### 90min_plan_progress.json
```typescript
{
  plan_created: timestamp      // When the plan was created
  last_updated: timestamp     // Last state update
  phase_state: {             // Status of each phase
    phase1_verification: {...}
    phase2_core_chat: {...}
    phase3_deployment: {...}
  }
  success_metrics: {...}     // Overall success indicators
  risk_events: []           // Any risks encountered
  boundary_violations: []   // Any plan boundary crossings
  notes_for_next_claude: "" // Handoff notes
}
```

## Usage Guidelines

1. **State Updates**
   - Update project state after completing each step
   - Sync with global state when appropriate
   - Mark phases as complete only when fully verified
   - Document any issues in risk_events

2. **Handoff Protocol**
   - Review both project and global state
   - Check boundary_violations
   - Read notes_for_next_claude
   - Continue from last completed phase
   - Ensure global/local state consistency

3. **Risk Management**
   - Document all encountered issues
   - Note any boundary approaches
   - Preserve system stability
   - Maintain rollback capability
   - Protect both local and global state

## Success Criteria
- Build system verified
- UI state documented
- Core chat functionality confirmed
- Deployment preparation complete
- Global/local state consistency maintained

## Boundaries
- No UI changes
- No feature additions
- No performance optimization
- No edge case handling
- No breaking of global/local state links

Remember: This is a verification and documentation phase. The goal is to understand and document the current state, not to make changes. 