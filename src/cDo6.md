# Autonomic Development Context Map

## Core Knowledge Locations

### Primary Development Context
- `/home/jon/autonomic/*` - Primary source of truth for autonomic development
  - `methodology/` - Core methodologies and approaches
  - `templates/` - Execution templates and patterns
  - `patterns/` - Implementation patterns and practices

### Supporting Knowledge Sources
1. Project-Specific Context (`.gauntlet/`)
   - `patterns/` - Project-specific pattern implementations
   - `context/` - Runtime context and state
   - `metrics/` - Performance and execution metrics
   
2. IDE Context (`/home/jon/.cursor/context/`)
   - Development context
   - Editor state
   - Recent operations

3. Historical Context
   - `.gauntlet/logs/` - Execution history
   - `.gauntlet/metrics/` - Performance patterns
   - `.gauntlet/context/` - Historical states

## Context Enrichment Flow

### Stage 1: Base Context
Primary source: `/home/jon/autonomic/`
- Start with methodology understanding
- Build from core patterns
- Establish execution templates

### Stage 2: Context Enrichment
Enrich from:
1. `.gauntlet/patterns/`
2. `.gauntlet/context/`
3. `/home/jon/.cursor/context/`

### Stage 3: Execution Context
Runtime sources:
- `.gauntlet/metrics/`
- `.gauntlet/logs/`
- Current project state

## Usage Guidelines

1. **Primary Development**
   - Always start with `/home/jon/autonomic/`
   - Use as source of truth for patterns
   - Reference for methodologies

2. **Context Integration**
   - Pull project context from `.gauntlet/`
   - Integrate IDE context as needed
   - Maintain context harmony

3. **Execution Flow**
   - Follow established patterns
   - Preserve context across sessions
   - Maintain natural development flow

Remember: This map helps maintain context harmony across different knowledge sources while preserving the natural development flow. 