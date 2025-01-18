# Hour 1: Infrastructure Claude Plan

## Phase 1: Initial Setup (COMPLETED)

### 1. Frontend Build System ✓
- [x] Fix npm install performance
  - Optimized with --prefer-offline --no-audit --no-fund flags
  - Split into prod/dev installs (completed in ~7s)
- [x] Fix esbuild version
  - Added esbuild@0.18.20 to package.json
  - Clean reinstall with optimized flags
  - Verified installation
- [x] Verify Vite config
  - Checked config - looks good
  - All paths correct
  - Dependencies validated

### 2. Basic Backend Setup ✓
- [x] Implement basic FastAPI app
  - Set up CORS ✓
  - Basic health check ✓ (verified working)
  - Error handling ✓
- [x] Fix Poetry configuration
  - Updated dependencies ✓
  - Fixed package structure with packages = [{include = "src"}] ✓
  - Modernized dev dependencies section ✓

### 3. Development Environment ✓
- [x] Configure concurrent running
  - Created root package.json with optimized scripts
  - Set up concurrently for service management
  - Fixed Vite path to use npx ✓
  - Configured proper ports (5173 frontend, 8000 backend)
- [x] Set up hot reload
  - Frontend HMR enabled by default with Vite ✓
  - Backend reload enabled with uvicorn --reload ✓
  - Both services watching for changes ✓

## Phase 2: Code Restructuring (NEW)

### 1. Backend Code Separation
- [ ] Move JavaScript files out of backend
  ```
  Current structure with issues:
  backend/src/
    ├── core/          # Core system functionality ⚠️
    ├── services/      # API and service integrations ⚠️
    └── utils/         # Utility functions ⚠️
  ```
- [x] Identify and categorize JS files
  - [x] Scan all backend directories
  - [x] List all JS files and their purposes
  - [x] Determine correct frontend locations

File Categories for Migration:
1. Core System Files (~250 files)
   - Autonomic system components
   - Flow management
   - Energy tracking
   - Space management
   - Pattern recognition
   - Type system
   Target: `frontend/src/core/`

2. Service Integration (6 files)
   - API client
   - Chat services
   - RAG services
   - Supabase integration
   Target: `frontend/src/services/`

3. React Hooks (~20 files)
   - Flow hooks
   - Energy hooks
   - Pattern hooks
   - Protection hooks
   Target: `frontend/src/hooks/`

4. Type Definitions (~100 files)
   - System types
   - Flow types
   - Space types
   - Energy types
   Target: `frontend/src/types/`

5. Testing Files (~30 files)
   - Unit tests
   - Test utilities
   - Test setup
   Target: `frontend/src/tests/`

6. Utilities (5 files)
   - Error handling
   - Debug utilities
   - Test utilities
   Target: `frontend/src/utils/`

Migration Strategy:
1. Create directory structure in frontend
2. Move files in batches by category
3. Update imports after each batch
4. Test functionality after each batch

### 2. Frontend Restructuring
- [x] Create proper frontend structure for moved files
  ```
  frontend/src/
    ├── core/          # Core system functionality ✓
    │   ├── autonomic/ # Autonomic system ✓
    │   ├── flow/      # Flow management ✓
    │   ├── energy/    # Energy tracking ✓
    │   ├── space/     # Space management ✓
    │   └── pattern/   # Pattern recognition ✓
    ├── services/      # API and service integrations ✓
    │   ├── apiClient.js  # API client ✓
    │   ├── chat/        # Chat services ✓
    │   ├── rag/         # RAG services ✓
    │   └── supabase.js  # Supabase integration ✓
    ├── hooks/         # React hooks ✓
    │   ├── useMessageHistory.js  # Existing hook
    │   ├── useFlow.js           # Flow hooks ✓
    │   ├── useFlowState.js      # Flow state hook ✓
    │   ├── useEnergy.js         # Energy hook ✓
    │   ├── usePattern.js        # Pattern hook ✓
    │   └── useProtection.js     # Protection hook ✓
    ├── __tests__/    # Test files ✓
    │   ├── core/     # Core tests ✓
    │   │   ├── energy/    # Energy tests ✓
    │   │   ├── autonomic/ # Autonomic tests ✓
    │   │   └── hooks/     # Hook tests ✓
    │   └── utils/    # Utility tests ✓
    ├── types/         # TypeScript definitions ✓
    │   ├── base/      # Base types ✓
    │   ├── flow/      # Flow types ✓
    │   ├── space/     # Space types ✓
    │   ├── energy/    # Energy types ✓
    │   ├── autonomic/ # Autonomic system types ✓
    │   ├── context/   # Context types ✓
    │   ├── pattern/   # Pattern types ✓
    │   ├── protection/# Protection types ✓
    │   ├── utils/     # Utility types ✓
    │   └── validation/# Validation types ✓
    ├── components/    # React components (existing)
    ├── contexts/      # React contexts (existing)
    ├── assets/        # Static assets (existing)
    ├── api/           # API utilities (existing)
    ├── theme/         # UI theme (existing)
    └── utils/         # Utility functions ✓
  ```
- [x] Move files with dependency preservation
  1. [x] Move utilities first (least dependencies)
     - ✓ errors.js
     - ✓ testUtils.js
  2. [x] Move type definitions
     - ✓ Base types
     - ✓ Flow types
     - ✓ Space types
     - ✓ Energy types
     - ✓ Autonomic types
     - ✓ Context types
     - ✓ Pattern types
     - ✓ Protection types
     - ✓ Utility types
     - ✓ Validation types
  3. [x] Move core system files
     - ✓ Create core subdirectories
     - ✓ Move autonomic system
     - ✓ Move flow management
     - ✓ Move energy tracking
     - ✓ Move space management
     - ✓ Move pattern recognition
  4. [x] Move service integrations
     - ✓ API client
     - ✓ Chat services
     - ✓ RAG services
     - ✓ Supabase integration
  5. [x] Move React hooks
     - ✓ Flow hooks (useFlow.js, useFlowState.js)
     - ✓ Energy hooks (useEnergy.js)
     - ✓ Pattern hooks (usePattern.js)
     - ✓ Protection hooks (useProtection.js)
  6. [x] Move tests last
     - ✓ Unit tests
     - ✓ Test utilities
     - ✓ Test setup
- [ ] Update frontend imports and references
  - [x] Fix import paths in core files:
    1. [x] Autonomic system imports
       - ✓ Updated paths from '../energy/EnergySystem' to '../../energy/EnergySystem'
       - ✓ Updated paths from '../flow/FlowStateGuardian' to '../../flow/FlowStateGuardian'
       - ✓ Updated paths from '../patterns/PatternCoherence' to '../../pattern/PatternCoherence'
       - ✓ Updated paths from '../../types/base' to '../../../types/base'
    2. [x] Energy system imports
       - ✓ Updated paths from '../types/consciousness' to '../../../types/consciousness'
       - ✓ Updated paths from '../experience/NaturalFlow' to '../../experience/NaturalFlow'
       - ✓ Updated paths from '../types/base' to '../../../types/base'
    3. [x] Flow system imports
       - ✓ Updated paths from '../types/stream' to '../../../types/stream'
       - ✓ Updated paths from '../experience/FlowEngine' to '../../experience/FlowEngine'
       - ✓ Updated paths from '../types/primitives/base' to '../../../types/primitives/base'
    4. [x] Space system imports
       - ✓ Updated paths from '../types/protection' to '../../../types/protection'
       - ✓ Updated paths from '../hooks/useFlowState' to '../../../hooks/useFlowState'
       - ✓ Updated paths from '../hooks/useProtection' to '../../../hooks/useProtection'
    5. [x] Pattern system imports
       - ✓ Updated paths from '../types/base' to '../../../types/base'
       - ✓ Updated paths from '../types/consciousness' to '../../../types/consciousness'
       - ✓ Updated paths from '../flow/NaturalFlow' to '../../flow/NaturalFlow'
  - [x] Fix import paths in service files:
    1. [x] API client imports
       - ✓ Updated path to config
       - ✓ Updated path to utils/errors
    2. [x] Chat service imports
       - ✓ Updated path to config
       - ✓ Updated path to utils/errors
       - ✓ Updated path to supabase
    3. [x] RAG service imports
       - ✓ Updated path to chat
       - ✓ Updated path to utils/errors
    4. [x] Supabase integration imports
       - ✓ Updated path to config
  - [x] Fix import paths in hook files:
    1. [x] Flow hooks
       - ✓ Updated path to flow constants
       - ✓ Updated path to flow metrics
    2. [x] Energy hooks
       - ✓ Updated path to energy types
    3. [x] Pattern hooks
       - ✓ Updated path to pattern types
    4. [x] Protection hooks
       - ✓ No changes needed (no relative imports)
  - [x] Fix import paths in test files:
    1. [x] Core tests
       - ✓ Energy tests (updated paths to types and utils)
       - ✓ Autonomic tests (updated paths to types and core)
       - ✓ Hook tests (updated paths to hooks and types)
    2. [x] Utils tests
       - ✓ Updated paths to types and utils
       - ✓ Updated paths to setup and components
  - [ ] Test frontend functionality:
    1. [x] Build verification
       - [x] Run npm build
       - [x] Found import path issue with theme
       - [x] Fixed theme import path
       - [x] Fixed Supabase auth imports
       - [x] Fixed component imports and paths
       - [x] Created missing components (ErrorBoundary, Message, FileUpload)
       - [x] Fixed ChatContainer imports
       - [x] Fixed API client implementation
       - [x] Successful production build
    2. [x] Runtime verification
       - [x] Start development server
       - [x] Configure Supabase credentials
       - [x] Linked Supabase project
       - [x] Fixed port conflicts (5173, 8000)
       - [x] Debug UI display issues
         - [x] Check ChakraProvider setup
         - [x] Verify theme configuration
         - [x] Debug AuthProvider state
         - [x] Fixed root element ID mismatch
       - [x] Configure Supabase project
         - [x] Enable email auth (working)
         - [x] Configure auth settings (working)
         - [x] Set up auth policies (working)
         - [x] Configure email templates (using default)
         - [x] Set up database schema
           - [x] Create messages table
           - [x] Configure RLS policies
           - [x] Enable real-time
       - [x] Test authentication flow
         - [x] Verify Supabase Auth UI displays
         - [x] Test email/password signup (working)
         - [x] Test email/password login (working)
         - [x] Verify session persistence (working)
       - [ ] Test chat interface
         - [x] Implement backend message endpoints
         - [x] Fixed message format mismatch
         - [x] Test message sending (working)
         - [x] Test message history loading (working)
         - [ ] Test real-time updates
           - [x] Switch to Supabase real-time
           - [ ] Test channel subscription
           - [ ] Test message broadcasting
           - [ ] Verify real-time delivery
       - [ ] Test file uploads
         - [ ] Implement backend file endpoints
         - [ ] Test file selection
         - [ ] Test upload progress
         - [ ] Verify file preview
       - [ ] Verify real-time updates
         - [ ] Test message subscription
         - [ ] Test presence indicators
         - [ ] Test typing indicators

### 3. Backend Python Structure
- [ ] Create clean Python backend structure
  ```python
  backend/
    src/
      ├── main.py          # Entry point
      ├── config/          # Configuration
      │   └── __init__.py
      ├── models/          # Data models
      │   ├── __init__.py
      │   ├── message.py   # Message model ✓
      │   └── user.py      # User model
      ├── routes/          # API routes
      │   ├── __init__.py
      │   ├── auth.py      # Auth routes
      │   ├── messages.py  # Message routes ✓
      │   └── files.py     # File upload routes
      ├── services/        # Business logic
      │   ├── __init__.py
      │   ├── auth.py      # Auth service
      │   ├── messages.py  # Message service ✓
      │   └── files.py     # File service
      └── utils/           # Utilities
          └── __init__.py
  ```
- [ ] Implement backend API endpoints
  1. [x] Message endpoints
     - [x] GET /messages/{channel} - Fetch messages (working)
     - [x] POST /messages/{channel} - Send message (working)
     - [x] Real-time updates (using Supabase)
  2. [ ] File endpoints
     - [ ] POST /files/{channel} - Upload file
     - [ ] GET /files/{channel}/{file_id} - Get file
  3. [ ] Auth endpoints
     - [ ] GET /auth/session - Get session
     - [ ] POST /auth/refresh - Refresh token

## Phase 3: Verification & Testing

### 1. Frontend Verification
- [ ] Test all moved JavaScript functionality
- [ ] Verify build process
- [ ] Check for broken dependencies
- [ ] Run frontend tests

### 2. Backend Verification
- [ ] Test Python structure
- [ ] Verify API endpoints
- [ ] Check dependency injection
- [ ] Run backend tests

### 3. Integration Testing
- [ ] Test frontend-backend communication
- [ ] Verify CORS configuration
- [ ] Check concurrent running
- [ ] Validate hot reload

## Success Criteria
- [ ] Clean separation of frontend and backend code
- [x] Frontend builds without errors
- [x] Backend starts and serves requests
- [x] Both run concurrently
- [x] Hot reload working
- [x] Basic API endpoints accessible

## Emergency Fallbacks
- Known working versions:
  - esbuild: 0.18.20
  - vite: 5.4.11
  - fastapi: 0.109.0
  - uvicorn: 0.27.0
- Rollback steps:
  1. Use package-lock.json for frontend deps
  2. Use poetry.lock for backend deps
  3. Keep optimized install flags
  4. Git branch before restructuring

## Notes
- Major restructuring needed but base functionality works
- Frontend and backend servers running successfully
- Need to maintain working state during restructuring
- Document all moved files and their new locations

## Next Steps
1. [ ] Begin Phase 2 code restructuring
2. [ ] Complete verification after each major change
3. [ ] Update documentation with new structure
4. [ ] Begin monitoring setup
5. [ ] Prepare for CI/CD work 