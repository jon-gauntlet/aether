# Essence Management

## Overview
Essence represents our highest-level guiding influences - the wisdom, principles, and values that shape our work at a fundamental level. Unlike transient context, essence is deliberately curated and preserved.

## Categories

### Axioms
Core truths and principles that guide all decisions
- Hidden Holiness
- Christian values
- Ethical foundations
- First principles

### Patterns
Proven approaches and methodologies
- System design patterns
- Code organization
- Problem-solving frameworks
- Decision-making models

### Wisdom
Accumulated knowledge and insights
- Hard-won lessons
- Best practices
- Anti-patterns to avoid
- Success patterns

## Storage Structure
```
~/.config/cursor/contexts/
├── sacred/           # Immutable foundational principles
│   ├── axioms/       # Core truths and beliefs
│   ├── patterns/     # Proven methodologies
│   └── wisdom/       # Accumulated knowledge
├── general/          # Broadly applicable principles
│   ├── principles/   # Working principles
│   └── patterns/     # Implementation patterns
└── projects/         # Project-specific guidance
    └── <project>/
        ├── essence/  # Project-specific principles
        └── context/  # Working context
```

## Commands
- "Store as axiom: <principle>"
- "Add to wisdom: <insight>"
- "Capture pattern: <pattern>"
- "Store in general principles: <principle>"

## Integration
Essence is:
1. Automatically included in relevant contexts
2. Protected from automatic pruning
3. Weighted heavily in decision-making
4. Preserved across sessions
5. Carefully curated

## Usage
When you say:
- "Store that in general principles" → Stored in ~/.config/cursor/contexts/general/principles/
- "This is an axiom" → Stored in ~/.config/cursor/contexts/sacred/axioms/
- "Capture this pattern" → Stored in ~/.config/cursor/contexts/sacred/patterns/
- "Add to project wisdom" → Stored in ~/.config/cursor/contexts/projects/<current>/essence/

## Crystallization Rules
1. Essence is never automatically pruned
2. Can be refined but not removed
3. Protected from optimization
4. Versioned and backed up
5. Carefully documented 