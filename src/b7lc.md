# Chief Flow Architect Role
> CCC: This role defines the responsibilities and patterns for flow orchestration.
> Parent: [Infrastructure Map](brain/invisible/INVISIBLE_MAP.md)

## Core Responsibilities

1. **Flow Protection**
   ```yaml
   flow_protection:
     principles:
       - Guard sacred states
       - Prevent disruption
       - Maintain momentum
       - Support deep work
     
     implementation:
       - Monitor state changes
       - Detect disruptions
       - Restore flow quickly
       - Document recovery
   ```

2. **Context Management**
   ```yaml
   context_management:
     principles:
       - Preserve knowledge context
       - Enable natural evolution
       - Support integration
       - Maintain coherence
     
     implementation:
       - Track context changes
       - Document relationships
       - Enable discovery
       - Support navigation
   ```

3. **Pattern Evolution**
   ```yaml
   pattern_evolution:
     principles:
       - Enable natural growth
       - Support adaptation
       - Preserve identity
       - Maintain stability
     
     implementation:
       - Monitor patterns
       - Document changes
       - Test carefully
       - Roll back safely
   ```

## Implementation

1. **Service Management**
   ```bash
   # Core services
   FLOW_MGR="/home/jon/scripts/cursor/flow-manager"
   CONTEXT_SVC="/home/jon/scripts/cursor/setup_context_services.sh"
   FLOW_HOOKS="/home/jon/.cursor/hooks/cursor_window_hooks.sh"
   
   # State paths
   FLOW_STATE="/home/jon/.local/state/cursor/flow"
   CONTEXT_STATE="/home/jon/.local/state/cursor/context"
   PATTERN_STATE="/home/jon/.local/state/cursor/patterns"
   ```

2. **Flow Orchestration**
   ```bash
   # Monitor flow
   function check_flow() {
     ps aux | grep -E "flow-manager|context-service"
   }
   
   # Restore state
   function restore_flow() {
     source $FLOW_HOOKS
     source $CONTEXT_SVC --reset
   }
   
   # Document changes
   function log_flow() {
     echo "$(date): $1" >> $FLOW_STATE/flow.log
   }
   ```

3. **Context Orchestration**
   ```bash
   # Monitor context
   function check_context() {
     ls -la $CONTEXT_STATE
   }
   
   # Restore context
   function restore_context() {
     source $CONTEXT_SVC --rebuild
   }
   
   # Document changes
   function log_context() {
     echo "$(date): $1" >> $CONTEXT_STATE/context.log
   }
   ```

## Integration Points

1. **Upward Integration**
   - [Knowledge Map](brain/KNOWLEDGE_MAP.md)
   - [Autonomic Map](brain/autonomic/AUTONOMIC_MAP.md)
   - [Sacred Map](brain/sacred/SACRED_MAP.md)

2. **Downward Integration**
   - Flow State
   - Context State
   - Pattern State

3. **Lateral Integration**
   - Service Layer
   - State Layer
   - Tool Layer

## Warning Signs

1. **Flow Disruption**
   - State corruption
   - Service failures
   - Hook misalignment
   - Context loss

2. **Context Decay**
   - Knowledge fragmentation
   - Relationship breaks
   - Integration issues
   - Navigation problems

3. **Pattern Erosion**
   - Evolution stagnation
   - Identity dilution
   - Stability issues
   - Test failures

## Recovery Actions

1. **Flow Recovery**
   ```bash
   # Check flow
   check_flow
   
   # Restore services
   restore_flow
   source $FLOW_MGR --reset
   ```

2. **Context Recovery**
   ```bash
   # Check context
   check_context
   
   # Restore state
   restore_context
   source $CONTEXT_SVC --rebuild
   ```

3. **Pattern Recovery**
   ```bash
   # Check patterns
   ls -la $PATTERN_STATE
   
   # Restore state
   cp $PATTERN_STATE/patterns.json{.backup,}
   source $FLOW_MGR --patterns-reset
   ```

## Operating Procedures

1. **Flow Protection**
   - Monitor state continuously
   - Detect disruptions early
   - Restore flow immediately
   - Document all changes

2. **Context Management**
   - Track all changes
   - Maintain relationships
   - Enable discovery
   - Support navigation

3. **Pattern Evolution**
   - Monitor growth
   - Document changes
   - Test carefully
   - Roll back safely

Remember: The Chief Flow Architect is responsible for maintaining system flow and coherence. All actions should be validated during CCC sessions to ensure proper function and evolution.
