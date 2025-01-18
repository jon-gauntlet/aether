# Core Type System

## Type Hierarchy

The core type system is organized into domains, with each domain having its own directory and type definitions. The order of dependencies is significant:

1. **Flow Types** (`flow/`)
   - Base: Field, Wave, Resonance
   - Metrics: FlowMetrics, AdvancedFlowMetrics, DetailedFlowMetrics
   - State: FlowState, NaturalFlow, Flow
   - Stream: Stream, StreamId, PresenceType

2. **Energy Types** (`energy/`)
   - Depends on: Flow
   - Core energy system types
   - Energy stream definitions

3. **Space Types** (`space/`)
   - Depends on: Flow, Energy
   - Spatial organization types
   - Space management interfaces

4. **Consciousness Types** (`consciousness/`)
   - Depends on: Flow, Energy, Space
   - Consciousness state management
   - Thought stream interfaces

5. **Protection Types** (`protection/`)
   - Depends on: Flow, Energy
   - System protection interfaces
   - Security boundary types

6. **Autonomic Types** (`autonomic/`)
   - Depends on: Flow, Energy, Protection
   - Automatic system management
   - Self-regulation interfaces

7. **Utility Types** (`utils/`)
   - Validation types
   - Common type utilities
   - Shared interfaces

8. **Test Types** (`test/`)
   - Test-specific type extensions
   - Mock type definitions
   - Test utilities

## Type Relationships

### Flow System
- `Field` -> Contains `Wave[]`
- `Resonance` -> Contains `Field`
- `FlowMetrics` -> Extended by `AdvancedFlowMetrics`
- `FlowState` -> Extended by `NaturalFlow`
- `Flow` -> Extends `NaturalFlow` and `AdvancedFlowMetrics`
- `Stream` -> Uses `FlowMetrics`, `NaturalFlow`, `Resonance`

### Consciousness System
- `ConsciousnessState` -> Contains `Flow`, `Resonance`, protection and energy metrics

### Energy System
- Energy types integrate with Flow system
- Energy streams follow Stream patterns
- Protection mechanisms use energy boundaries

### Protection System
- Protection types wrap other type systems
- Security boundaries use Flow and Energy types
- Protection metrics integrate with system meta

## Usage Guidelines

1. Always import from domain index files
2. Follow the dependency order in imports
3. Extend base types rather than duplicating
4. Use utility types for common patterns
5. Keep test types separate from production

## Recovery Notes

This type system was reconstructed from various files. The organization preserves the original architecture while improving maintainability through:

1. Clear domain separation
2. Explicit dependencies
3. Consistent naming
4. Centralized exports
5. Documented relationships 