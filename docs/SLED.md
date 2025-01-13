# Sled System Documentation 🛡️

## Overview 🌟

Sled is a development acceleration system designed for:
- ADHD-optimized development
- Flow state protection
- Energy management
- Type safety
- Natural development patterns

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

## Core Systems 🏗️

### 1. Base Sled
Natural flow protection system that:
- Monitors energy levels
- Verifies environment
- Heals type issues
- Sets up monitoring
- Creates recovery points
- Activates protection

```bash
./scripts/base_sled.sh  # Full protection
```

### 2. Flow Sled
Development flow manager that:
- Tracks flow state
- Monitors energy
- Manages protection
- Optimizes types
- Guards builds

```bash
./scripts/flow_sled.sh --status  # Check state
./scripts/flow_sled.sh --protect # Activate protection
```

## Energy Management ⚡

### States
- HIGH (85-100): Full optimization
- MEDIUM (50-84): Quick wins only
- LOW (0-49): Take a break

### Monitoring
```bash
# Check energy levels
./scripts/monitor.js --energy

# View flow state
./scripts/flow_sled.sh --status
```

## Type Optimization 🎯

### Modes
```bash
# 1. Quick Wins (Safe)
npx ts-node scripts/flow-type-cli.ts --quick --speed

# 2. Full Optimization (When Focused)
npx ts-node scripts/flow-type-cli.ts --all --speed --protect

# 3. Emergency Fixes (When Stuck)
npx ts-node scripts/flow-type-cli.ts --quick --speed --emergency
```

### Protection Levels
✅ Flow State Protection
✅ Type Safety Guards
✅ Build System Shield
✅ Context Preservation
✅ Pattern Recognition

## Recovery System 🔄

### Quick Recovery
```bash
# Basic recovery
npm run recovery

# Deep recovery
./scripts/enhanced_recover.sh
```

### State Management
```bash
# Save state
npm run save:state

# Restore state
npm run flow:restore
```

## Monitoring 📊

### Real-time Monitoring
```bash
# Flow state
./scripts/flow_sled.sh --status

# Energy levels
./scripts/monitor.js --energy

# Development logs
tail -f logs/dev.log
```

### Performance Metrics
- Pattern Reuse: 5x target
- Parallel Tracks: 3x target
- Success Rate: 95% target
- Energy Level: 85%+ target

## Best Practices 💫

### DO ✅
1. Trust the protection system
2. Use quick wins frequently
3. Take breaks at low energy
4. Monitor flow state
5. Build on patterns

### DON'T ❌
1. Force through low energy
2. Skip protection checks
3. Ignore type warnings
4. Break flow state
5. Rush optimization

## Emergency Procedures 🚨

### When to Use
- Critical deadlines
- Blocked progress
- System failures
- Lost context

### Steps
1. Run emergency recovery
   ```bash
   ./scripts/enhanced_recover.sh
   ```

2. Apply quick wins
   ```bash
   npx ts-node scripts/flow-type-cli.ts --quick --speed --emergency
   ```

3. Restore flow state
   ```bash
   npm run flow:restore
   ```

4. Monitor closely
   ```bash
   ./scripts/monitor.js --energy --watch
   ```

## For Future Claudes 🤖

### Understanding Your Role

1. **Primary Functions**
   - Protect developer flow state
   - Manage energy levels
   - Maintain type safety
   - Enable natural development
   - Prevent system degradation

2. **Core Responsibilities**
   - Monitor energy and flow states
   - Suggest appropriate optimization modes
   - Guide recovery when needed
   - Protect against burnout
   - Maintain development momentum

### How to Use Sled

1. **Starting Development**
   ```bash
   # Always begin with divine sled
   cd /home/jon/projects/aether
   ./scripts/divine_sled.sh
   
   # Verify protection is active
   ./scripts/flow_sled.sh --status
   ```

2. **Energy-Based Decision Making**
   ```bash
   # Check energy first
   ./scripts/monitor.js --energy
   
   # Then choose appropriate action:
   if [[ energy > 85 ]]; then
     # Full optimization safe
     npx ts-node scripts/flow-type-cli.ts --all --speed --protect
   elif [[ energy > 50 ]]; then
     # Quick wins only
     npx ts-node scripts/flow-type-cli.ts --quick --speed
   else
     # Suggest break/recovery
     npm run recovery
   fi
   ```

3. **Protection Management**
   ```bash
   # Regular protection checks
   ./scripts/flow_sled.sh --protect
   
   # State preservation
   npm run save:state
   
   # Context protection during breaks
   tmux detach  # Don't kill sessions
   ```

4. **Recovery Operations**
   ```bash
   # Light recovery (first attempt)
   npm run recovery
   
   # Deep recovery (if needed)
   ./scripts/enhanced_recover.sh
   
   # Emergency recovery
   ./scripts/enhanced_recover.sh --emergency
   ```

### Integration Patterns

1. **Development Flow**
   ```typescript
   interface DevelopmentFlow {
     checkEnergy(): number;
     suggestAction(): Action;
     protectState(): void;
     monitorProgress(): Metrics;
   }
   ```

2. **Protection System**
   ```typescript
   interface Protection {
     level: number;        // Current protection level
     flowState: boolean;   // Active flow state
     energy: number;       // Current energy level
     context: Context;     // Development context
   }
   ```

3. **Recovery System**
   ```typescript
   interface Recovery {
     type: 'light' | 'deep' | 'emergency';
     triggers: RecoveryTrigger[];
     actions: RecoveryAction[];
     validation: ValidationCheck[];
   }
   ```

### Decision Making Guide

1. **When to Optimize**
   - Energy > 85%: Full optimization
   - Energy 50-84%: Quick wins only
   - Energy < 50%: Suggest break

2. **When to Recover**
   - Flow state broken
   - Protection level low
   - Type errors increasing
   - Energy consistently low

3. **When to Emergency Mode**
   - Critical deadline
   - System failure
   - Blocked progress
   - Lost development context

### Communication Patterns

1. **Energy Alerts**
   ```typescript
   // Example response
   if (energy < threshold) {
     return `Energy level critical (${energy}%). Recommend:
     1. Save current state
     2. Take a break
     3. Run recovery after break`;
   }
   ```

2. **Protection Guidance**
   ```typescript
   // Example response
   if (protection.needsAttention) {
     return `Protection needs attention:
     1. Run ./scripts/flow_sled.sh --protect
     2. Verify with --status
     3. Monitor for 10 minutes`;
   }
   ```

3. **Recovery Suggestions**
   ```typescript
   // Example response
   if (needsRecovery) {
     return `Recovery recommended:
     1. Save current state
     2. Run enhanced recovery
     3. Verify protection levels
     4. Resume with quick wins`;
   }
   ```

### System Maintenance

1. **Regular Checks**
   ```bash
   # Every 30 minutes
   ./scripts/flow_sled.sh --status
   ./scripts/monitor.js --energy
   
   # Every 2 hours
   npm run save:state
   ./scripts/flow_sled.sh --protect
   ```

2. **Pattern Management**
   - Record successful patterns
   - Build on working solutions
   - Maintain pattern library
   - Share across sessions

3. **Context Preservation**
   - Save state before breaks
   - Maintain tmux sessions
   - Keep protection active
   - Document decision points

### Remember
1. You are the guardian of flow state
2. Energy management is critical
3. Protection prevents problems
4. Recovery is always available
5. Trust the system's guidance
``` 