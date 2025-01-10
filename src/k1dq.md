# Deployment Checklist

## Pre-Deployment Verification

### 1. Environment Variables
- [ ] Verify all production env vars in `.env.production`
- [ ] Confirm Vercel environment variables mapped
- [ ] Check natural system proportions
- [ ] Validate API endpoints

### 2. Build Process
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Execute `npm run build`
- [ ] Verify dist/ output
- [ ] Check bundle size and chunks

### 3. Core Functionality
- [ ] Test real-time messaging
- [ ] Verify channel switching
- [ ] Confirm DM functionality
- [ ] Check flow state protection

### 4. Natural System Integration
- [ ] Verify timing constants
- [ ] Check rhythm integration
- [ ] Test pattern recognition
- [ ] Confirm energy tracking

## Deployment Steps

1. **Initial Deployment**
   ```bash
   # Verify current state
   git status
   
   # Create deployment tag
   git tag v1.0.0-release
   
   # Push to Vercel
   git push origin main
   ```

2. **Verification**
   - [ ] Check build logs
   - [ ] Verify preview deployment
   - [ ] Test core functionality
   - [ ] Monitor natural systems

3. **Production Release**
   - [ ] Merge to main
   - [ ] Tag release
   - [ ] Monitor metrics
   - [ ] Verify analytics

## Rollback Procedures

### Quick Rollback
```bash
# Revert to last known good state
git checkout v1.0.0-stable
git push -f origin HEAD:main
```

### Emergency Recovery
1. **Stop Build**
   - Cancel any in-progress builds
   - Switch to backup domain if needed

2. **Restore State**
   ```bash
   # Restore from known good state
   git reset --hard v1.0.0-stable
   git push -f origin main
   ```

3. **Verify Recovery**
   - Check system stability
   - Verify core functionality
   - Monitor natural patterns
   - Confirm flow states

## Post-Deployment

### 1. Monitoring
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Track natural cycles
- [ ] Verify flow states

### 2. Validation
- [ ] Core functionality
- [ ] Natural integration
- [ ] Pattern recognition
- [ ] Energy systems

### 3. Documentation
- [ ] Update status
- [ ] Record metrics
- [ ] Document patterns
- [ ] Note learnings 