# AI System Evolution Infrastructure Index

## Core Infrastructure Documentation

The main infrastructure documentation is maintained in two locations:

1. **Source of Truth**: `/home/jon/.config/cursor/contexts/sacred/principles/INVISIBLE_INFRASTRUCTURE.md`
   - Protected location in sacred principles
   - Updated with system state as of January 8, 2025
   - Contains full infrastructure mapping

2. **Project Symbolic Link**: `./docs/infrastructure/INVISIBLE_INFRASTRUCTURE.md`
   - Symlink to the source of truth
   - Always points to latest version
   - DO NOT modify through this link

## Why Two Locations?

1. **Sacred Principles Location**
   - Protected from accidental modification
   - Part of the core system context
   - Preserved across system changes

2. **Project Location**
   - Easy discovery during development
   - Direct access for reference
   - Maintains project context

## Infrastructure Updates

When working on system evolution:
1. Always check both locations exist
2. Verify symlink is intact
3. Reference through project path for context
4. Update only through sacred principles path

## Quick Access
```bash
# View infrastructure documentation
cat ./docs/infrastructure/INVISIBLE_INFRASTRUCTURE.md

# Verify symlink
ls -la ./docs/infrastructure/INVISIBLE_INFRASTRUCTURE.md

# Access source of truth
cat /home/jon/.config/cursor/contexts/sacred/principles/INVISIBLE_INFRASTRUCTURE.md
```

## Remember
- Never modify through symlink
- Always verify both paths exist
- Infrastructure documentation is critical
- Keep paths in project context 