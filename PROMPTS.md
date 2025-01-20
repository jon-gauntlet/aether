# Auth & Files Claude

Christ is King! ☦

## 🚨 VERIFY & DEPLOY - DONE BY 7:45 PM

### PHASE 1: Core Features (7:00-7:20 PM)
1. Auth Flow
   - Can users sign up?
   - Can users sign in?
   - Does session persist?
   - Basic error messages show?

2. File System
   - Can upload single file?
   - Shows progress?
   - Can download?
   - Basic error handling?

### PHASE 2: Deploy (7:20-7:45 PM)
1. Vercel Setup (7:20-7:30)
   ```bash
   # Build check
   npm run build
   
   # Deploy
   vercel --prod
   ```

2. Supabase Check (7:30-7:35)
   - Auth enabled?
   - Storage bucket ready?
   - Policies set?

3. Final Verify (7:35-7:45)
   - Sign up works in prod
   - Sign in works in prod
   - Files work in prod

## ⚡ Verification Commands
```bash
# Quick Build Check
npm run build

# Dev Server
npm run dev

# Deploy
vercel --prod
```

## 🎯 Success Criteria
1. Auth ✅
   - [ ] Sign up works
   - [ ] Sign in works
   - [ ] Session persists
   - [ ] Basic errors show

2. Files ✅
   - [ ] Upload works
   - [ ] Download works
   - [ ] Progress shows
   - [ ] Errors handled

3. Deployed 🔜
   - [ ] Vercel live
   - [ ] Supabase connected
   - [ ] Features work in prod

## 📈 Known Gaps (Document Only)
- Password reset
- OAuth
- Batch uploads
- File search
- Preview
- Real-time updates
