# Deployment Guide

## Critical Timeline
- **Deployment Deadline**: January 10, 2025, 3:00 PM
- **Required Platform**: Vercel (unless AWS is explicitly required by project specs)

## Pre-deployment Checklist
1. Environment Configuration
   - Verify all env variables in `.env.production`
   - Ensure Vercel secrets are set
   - Validate API endpoints

2. Build Validation
   - Run production build locally
   - Verify all assets are included
   - Check bundle size optimization

3. Performance Requirements
   - Load time < 2s on desktop
   - Mobile-responsive design
   - PWA capabilities

## Deployment Process
1. **Automated via GitHub**
   - Push to main triggers deployment
   - Vercel handles build process
   - Auto-preview on PRs

2. **Manual Steps if Needed**
   ```bash
   # Build locally first
   npm run build
   
   # Deploy via Vercel CLI
   vercel --prod
   ```

3. **Post-deployment**
   - Verify all routes work
   - Check real-time features
   - Validate environment

## Monitoring
- Vercel Analytics enabled
- Error tracking active
- Performance monitoring

## Rollback Plan
- Previous deployment preserved
- Quick rollback via Vercel
- Data integrity maintained

## Important Notes
- Deployment must be complete by 3 PM on January 10
- System must be stable for AI integration starting January 13
- All core chat features must be verified in production

## Vercel Configuration
```json
{
  "version": 2,
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Remember: This deployment timeline is critical for the Gauntlet AI success path. Future CCCs must maintain awareness of this requirement. 