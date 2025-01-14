# Sled Quick Reference 🛡️

## Core Commands

```bash
# Start flow-optimized development
npm run flow

# Normal protected development
npm run dev:protected

# Type optimization
npx ts-node scripts/flow-sled-cli.ts --all

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

### Type Optimization
```bash
# Full optimization
npx ts-node scripts/flow-sled-cli.ts --all

# Quick wins only
npx ts-node scripts/flow-sled-cli.ts --quick

# Batch processing
npx ts-node scripts/flow-sled-cli.ts --batch

# Deep fixes
npx ts-node scripts/flow-sled-cli.ts --deep
```

### Handling Issues
```bash
# Quick recovery
npm run recovery

# Manual verification
npm run verify:env

# Type verification
npx ts-node scripts/flow-sled-cli.ts --status
```

### Monitoring State
```bash
# View all terminals
tmux attach -t dev

# Check specific logs
tail -f logs/dev.log
tail -f logs/tsc.log

# Check type optimization
npx ts-node scripts/flow-sled-cli.ts --status
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

## Type Optimization Status
Latest run results:
- Quick Wins: 628 fixes
- Batch Processing: 1,064 fixes
- Deep Fixes: 24 identified
- Energy: 100% maintained

## Remember
- Trust the protection system
- Let flow optimize
- Use type optimization regularly
- Keep momentum 