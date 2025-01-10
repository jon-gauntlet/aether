# File Reorganization Plan

## Directory Structure

```
/home/jon/
├── brain/
│   ├── systems/
│   │   └── autonomic.md
│   ├── today.md
│   └── gauntlet-vocab.md
├── autonomic/
│   ├── ecosystem.md
│   ├── methodology/
│   └── practices/
├── brainlifts/
│   ├── flow-state-optimization.md
│   ├── ai-first-development.md
│   └── natural-system-design.md
├── .config/cursor/contexts/
│   ├── sacred/
│   │   └── principles/
│   ├── roles/
│   └── patterns/
└── .local/share/aether/
    └── wisdom/
        └── patterns/
```

## Recovery Steps

1. Create Directory Structure
```bash
mkdir -p /home/jon/{brain/{systems,gauntlet},autonomic/{methodology,practices},brainlifts}
mkdir -p /home/jon/.config/cursor/contexts/{sacred/principles,roles,patterns}
mkdir -p /home/jon/.local/share/aether/wisdom/patterns
```

2. Recover Core Files
- Copy `28io.md` → `/home/jon/brain/systems/autonomic.md`
- Copy `e8Rx.md` → `/home/jon/autonomic/methodology/ai_first.md`
- Copy existing brainlifts to `/home/jon/brainlifts/`

3. Recover Configuration
- Copy sacred principles to `/home/jon/.config/cursor/contexts/sacred/principles/`
- Copy roles to `/home/jon/.config/cursor/contexts/roles/`
- Copy patterns to `/home/jon/.config/cursor/contexts/patterns/`

4. Verify Integration
- Check all symbolic links
- Verify file contents
- Test configuration loading

## File Mapping

### Core System Files
- `src/components/28io.md` → `/home/jon/brain/systems/autonomic.md`
- `src/components/e8Rx.md` → `/home/jon/autonomic/methodology/ai_first.md`
- `src/components/RMOk.md` → `/home/jon/autonomic/practices/patterns.md`

### Configuration Files
- `src/components/sacred/*` → `/home/jon/.config/cursor/contexts/sacred/principles/`
- `src/components/roles/*` → `/home/jon/.config/cursor/contexts/roles/`
- `src/components/patterns/*` → `/home/jon/.config/cursor/contexts/patterns/`

### BrainLifts
- Preserve existing brainlifts in `/home/jon/brainlifts/`
- Add any missing ones from `src/components/`

## Validation

1. Directory Structure
- Check all directories exist
- Verify permissions

2. File Content
- Verify file integrity
- Check for duplicates
- Resolve conflicts

3. Integration
- Test configuration loading
- Verify symbolic links
- Check system functionality 