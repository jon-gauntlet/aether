# Aether Project Prompts

Christ is King! ☦

## 🚨 MERGE TO MAIN FIRST

1. Stop current processes:
   ```bash
   pkill -f "npm"
   ```

2. Merge to main:
   ```bash
   cd /home/jon/git/aether
   git checkout main
   git pull
   git merge feature/auth-files
   git merge feature/websocket
   git push
   ```

3. Test in main:
   ```bash
   npm run dev
   ```
   Then verify at http://localhost:5173

## 🚨 VERIFY REAL FUNCTIONALITY

1. Auth & Files:
   - Sign up works
   - Sign in works
   - File upload works
   - Error handling works

2. WebSocket & Backend:
   - Messages send/receive
   - Real-time updates work
   - Error handling works
   - Performance is good

## 🚨 DEPLOY - DONE BY 7:45 PM

### PHASE 1: Core Features (7:00-7:20 PM)
1. Auth Flow
   - Users can sign up
   - Users can sign in
   - Sessions persist
   - Basic errors show

2. WebSocket Flow
   - Server connects
   - Messages work
   - Basic errors handled
   - Performance good

### PHASE 2: Deploy (7:20-7:45 PM)
1. Vercel Setup (7:20-7:30)
   ```bash
   # Build check
   npm run build
   
   # Deploy
   vercel --prod
   ```

2. Railway Setup (7:30-7:35)
   ```bash
   # Deploy backend
   railway up
   ```

3. Final Verify (7:35-7:45)
   - Auth works in prod
   - Files work in prod
   - Messages work in prod
   - Performance good

## ⚡ Success Criteria
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

3. WebSocket ✅
   - [ ] Server runs
   - [ ] Messages work
   - [ ] Errors handled
   - [ ] Performance good

4. Deployed 🔜
   - [ ] Vercel live
   - [ ] Railway live
   - [ ] Features work in prod

## 📈 Known Gaps (Document Only)
- Password reset
- OAuth
- Advanced file features
- Message search
- Advanced RAG features
- Complex error recovery
- Performance optimization
- Advanced metrics
