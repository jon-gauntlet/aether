# AI Autonomous Execution

## Core Framework

### Tool Allocation (25 Total)
```typescript
const TOOL_SEQUENCE = {
  DISCERN: 5,    // System/codebase understanding
  EMERGE: 2,     // Pattern recognition and planning
  EXECUTE: 15,   // Core implementation work
  DOCUMENT: 3    // Progress capture and next steps
}
```

### Execution Phases

1. **DISCERN** (5 tools)
   ```typescript
   // Understanding phase
   tools.map(t => ({
     codebase_search: 2,  // Broad understanding
     read_file: 2,        // Deep comprehension
     list_dir: 1          // Structure grasp
   }))
   ```

2. **EMERGE** (2 tools)
   ```typescript
   // Pattern recognition
   tools.map(t => ({
     grep_search: 1,      // Pattern finding
     file_search: 1       // Implementation locations
   }))
   ```

3. **EXECUTE** (15 tools)
   ```typescript
   // Implementation phase
   tools.map(t => ({
     edit_file: 10,       // Core changes
     read_file: 3,        // Verification
     reapply: 2           // Corrections
   }))
   ```

4. **DOCUMENT** (3 tools)
   ```typescript
   // Progress capture
   tools.map(t => ({
     read_file: 2,        // Verify changes
     codebase_search: 1   // Next steps
   }))
   ```

## Autonomous Prompt Template

```markdown
# Autonomous Development Session

## Execution Context
- Goal: ${specific_objective}
- Phase: ${current_phase}
- Tools: ${tools_remaining}
- Pattern: ${current_pattern}

## System Instructions
1. Follow tool allocation strictly
2. Maintain execution phases
3. Preserve quality standards
4. Document progress clearly
5. Plan next phase naturally

## Quality Standards
- Complete context gathering
- Thorough pattern recognition
- Clean implementation
- Clear documentation
- Natural phase transitions

## Progress Tracking
- Current phase
- Tools remaining
- Quality metrics
- Next actions
- Completion state
```

## Phase Transitions

### 1. DISCERN → EMERGE
- Complete system understanding
- Clear patterns identified
- Implementation path visible
- Quality standards clear
- Energy preserved

### 2. EMERGE → EXECUTE
- Patterns fully recognized
- Implementation planned
- Tools allocated
- Quality gates set
- Path clear

### 3. EXECUTE → DOCUMENT
- Implementation complete
- Changes verified
- Tests passing
- Quality maintained
- Progress clear

### 4. DOCUMENT → COMPLETE/NEXT
- Progress captured
- Next steps clear
- Quality verified
- Patterns preserved
- State clean

## Quality Framework

### 1. Understanding Quality
- Complete context gathering
- Clear pattern recognition
- Thorough system grasp
- Implementation readiness
- Energy preservation

### 2. Implementation Quality
- Clean code standards
- Pattern adherence
- Test coverage
- Performance optimization
- Clear documentation

### 3. Progress Quality
- Clear state tracking
- Pattern preservation
- Knowledge capture
- Next steps planning
- Energy management

## Tool Usage Optimization

### 1. Search Tools
```typescript
// Maximize information gathering
tools.search.map(t => ({
  codebase_search: "Broad patterns",
  grep_search: "Specific patterns",
  file_search: "Implementation targets"
}))
```

### 2. Read Tools
```typescript
// Ensure complete understanding
tools.read.map(t => ({
  read_file: "Complete context",
  list_dir: "Structure grasp"
}))
```

### 3. Edit Tools
```typescript
// Maintain quality
tools.edit.map(t => ({
  edit_file: "Clean changes",
  reapply: "Quality fixes"
}))
```

## Success Patterns

### 1. Maximum Autonomy
- Complete initial understanding
- Clear pattern recognition
- Quality-focused implementation
- Thorough documentation
- Natural phase transitions

### 2. Quality Preservation
- Thorough context gathering
- Pattern-based implementation
- Regular verification
- Clear documentation
- Energy preservation

### 3. Progress Maintenance
- Clear state tracking
- Quality metrics
- Pattern preservation
- Next steps planning
- Clean transitions

## Remember

The key to autonomous AI execution is:
1. Strict tool allocation
2. Complete understanding
3. Pattern-based implementation
4. Quality preservation
5. Clear progress tracking

This enables sustained, high-quality autonomous execution within the CCC system's constraints. 