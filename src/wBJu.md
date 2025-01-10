# Cursor Context Index

## Wisdom Locations

### Implementation Patterns
- Base Path: `/home/jon/.local/share/aether/wisdom/patterns/`
- Purpose: Core implementation patterns and wisdom
- Files:
  - `autonomic_agile.md`: AI-First Autonomic Agile implementation patterns
  - Additional pattern files will be added here

### Development Principles
- Base Path: `/home/jon/.local/share/aether/wisdom/principles/`
- Purpose: Foundational development principles
- Integration: All principles should be considered during development

### Development Practices
- Base Path: `/home/jon/.local/share/aether/wisdom/practices/`
- Purpose: Concrete development practices and methodologies
- Usage: Reference during active development

## Context Integration

### Project Detection
When opening a project, check for:
1. `.cursorrules` file
2. `.gauntlet/` directory
3. `PARADIGM.md` file
4. `PRINCIPLES.md` file

### Wisdom Integration
For any detected project:
1. Load relevant implementation patterns
2. Apply development principles
3. Integrate development practices
4. Maintain context awareness

### Pattern Recognition
Look for these patterns to determine context:
- AI-First development: Load autonomic patterns
- ADHD optimization: Load flow protection
- High-intensity development: Load energy patterns

## Context Paths
context.paths:
  - /home/jon/.local/share/aether/wisdom/**/*
  - /home/jon/.local/share/aether/contexts/**/*
  - /home/jon/.local/share/aether/learnings/**/*

## Search Patterns
search.include:
  - /home/jon/.local/share/aether/**/*.md
  - ${workspaceFolder}/**/*.md
  - ${workspaceFolder}/**/*.ts
  - ${workspaceFolder}/**/*.tsx

## Protection Rules
protect.paths:
  - /home/jon/.local/share/aether/
  - /home/jon/.config/cursor/contexts/ 