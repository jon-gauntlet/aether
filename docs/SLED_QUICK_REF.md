# Sled Quick Reference 🛡️

## Core Commands

```bash
# Start flow-optimized development
npm run flow

# Normal protected development
npm run dev:protected

# Quick recovery
npm run recovery

# Manual monitoring
npm run monitor
```

## Common Scenarios

### Starting Development
```bash
npm run flow
tmux attach -t flow
```

### Handling Issues
```bash
# Quick recovery
npm run recovery

# Manual verification
npm run verify:env
```

### Monitoring State
```bash
# View all terminals
tmux attach -t dev

# Check specific logs
tail -f logs/dev.log
tail -f logs/tsc.log
```

### Flow Breaks
```bash
# Manual state save
npm run save:state

# Restore flow
npm run flow:restore
```

## Protection Status

Check ✅ marks in terminal for:
- Node.js
- Files
- Dependencies
- Git
- TypeScript
- Environment

## Remember
- Trust the protection system
- Let flow optimize
- Use recovery when needed
- Keep momentum 