# Autonomous Prompt Patterns

## Core Patterns

### 1. Development Prompts
```typescript
interface DevelopmentPrompt {
  phase: 'discern' | 'emerge' | 'execute' | 'document';
  context: string[];
  tools: number;
  goal: string;
}
```

**Template:**
```markdown
# Development Context
${context.join('\n')}

## Current Phase: ${phase}
Tools Remaining: ${tools}

## Goal
${goal}

## Instructions
1. Follow natural cycles
2. Apply proven patterns
3. Maintain quality
4. Track progress
5. Document insights
```

### 2. Integration Prompts
```typescript
interface IntegrationPrompt {
  systems: string[];
  patterns: string[];
  metrics: string[];
  goal: string;
}
```

**Template:**
```markdown
# Integration Context
Systems: ${systems.join(', ')}
Patterns: ${patterns.join(', ')}
Metrics: ${metrics.join(', ')}

## Goal
${goal}

## Instructions
1. Ensure coherence
2. Follow patterns
3. Maintain quality
4. Enable evolution
5. Preserve wisdom
```

### 3. Quality Prompts
```typescript
interface QualityPrompt {
  standards: string[];
  metrics: string[];
  patterns: string[];
  goal: string;
}
```

**Template:**
```markdown
# Quality Context
Standards: ${standards.join(', ')}
Metrics: ${metrics.join(', ')}
Patterns: ${patterns.join(', ')}

## Goal
${goal}

## Instructions
1. Validate standards
2. Check metrics
3. Apply patterns
4. Ensure quality
5. Document learning
```

## Usage Patterns

### 1. Development Flow
1. **Initialize Context**
   ```markdown
   # Project Context
   - Goal: ${goal}
   - Phase: ${phase}
   - Tools: ${tools}
   - Patterns: ${patterns}
   ```

2. **Execute Phase**
   ```markdown
   # Phase Execution
   - Current: ${phase}
   - Tools: ${remaining}
   - Focus: ${metrics.focus}
   - Quality: ${metrics.quality}
   ```

3. **Document Progress**
   ```markdown
   # Progress Update
   - Completed: ${completed}
   - Insights: ${insights}
   - Patterns: ${patterns}
   - Next: ${next}
   ```

### 2. Quality Maintenance
1. **Check Standards**
   ```markdown
   # Quality Check
   - Standards: ${standards}
   - Metrics: ${metrics}
   - Issues: ${issues}
   - Actions: ${actions}
   ```

2. **Apply Patterns**
   ```markdown
   # Pattern Application
   - Context: ${context}
   - Pattern: ${pattern}
   - Solution: ${solution}
   - Validation: ${validation}
   ```

3. **Document Learning**
   ```markdown
   # Learning Capture
   - Insights: ${insights}
   - Patterns: ${patterns}
   - Evolution: ${evolution}
   - Integration: ${integration}
   ```

## Integration Examples

### 1. Development Session
```markdown
# Development Session
Goal: Implement new feature
Phase: Execute
Tools: 15 remaining

## Context
- Project: Authentication system
- Pattern: OAuth flow
- Quality: Test coverage

## Instructions
1. Follow OAuth patterns
2. Maintain test coverage
3. Document decisions
4. Track progress
5. Preserve insights
```

### 2. Quality Review
```markdown
# Quality Review
Goal: Ensure standards
Phase: Discern
Tools: 5 remaining

## Context
- Standards: Clean code
- Coverage: 90%+
- Performance: <100ms

## Instructions
1. Check standards
2. Validate metrics
3. Review patterns
4. Document issues
5. Plan improvements
```

### 3. System Integration
```markdown
# System Integration
Goal: Connect services
Phase: Emerge
Tools: 2 remaining

## Context
- Systems: Auth, API
- Pattern: Microservices
- Quality: Reliability

## Instructions
1. Verify interfaces
2. Ensure coherence
3. Test integration
4. Document patterns
5. Monitor metrics
```

## Remember

Effective prompts:
1. Provide clear context
2. Set specific goals
3. Follow patterns
4. Enable quality
5. Preserve wisdom

The key is maintaining consistency while allowing natural evolution through pattern recognition and quality preservation. 