# Cursor System Context

## External Wisdom System
Base Path: `/home/jon/.local/share/aether/`

This system maintains implementation wisdom, patterns, and learnings outside of project directories.

## Context Loading
1. Load global context index from `~/.config/cursor/contexts/index.md`
2. Integrate wisdom from `~/.local/share/aether/wisdom/**/*`
3. Apply context from `~/.local/share/aether/contexts/**/*`

## Project Integration
When a project contains:
- `.cursorrules`
- `.gauntlet/`
- `PARADIGM.md`
- `PRINCIPLES.md`

Load:
1. Implementation patterns from `/wisdom/patterns/`
2. Development principles from `/wisdom/principles/`
3. Development practices from `/wisdom/practices/`

## Search Paths
Include:
- `~/.local/share/aether/**/*.md`
- `~/.config/cursor/contexts/**/*.md`
- `${workspaceFolder}/**/*.md`
- `${workspaceFolder}/**/*.ts`

## Protection
Protected paths:
- `/home/jon/.local/share/aether/`
- `/home/jon/.config/cursor/contexts/`

## Usage
This context file ensures that:
1. External wisdom is always accessible
2. Project context is properly integrated
3. Implementation patterns are preserved
4. Learning accumulates safely 