# Repository Optimization Plan

## Core Principles
- JavaScript-first development (no TypeScript)
- Minimal development overhead
- Clear separation of concerns
- Code reuse through shared utilities
- Light tooling footprint

## Directory Restructure
```
/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── theme/         # Theme configuration
│   │   └── __tests__/     # Tests alongside components
├── backend/
│   ├── src/
│   │   ├── core/          # Core business logic
│   │   ├── services/      # Service layer
│   │   └── utils/         # Backend utilities
│   └── tests/            # Backend tests
└── shared/
    ├── utils/            # Shared utilities
    └── constants/        # Shared constants

## Configuration Consolidation
1. Frontend Configuration
   - Move all Vite configs to frontend/
   - Consolidate test setup in frontend/src/__tests__/setup.js
   - Keep frontend-specific package.json

2. Backend Configuration
   - Move Python configs to backend/
   - Consolidate test fixtures in backend/tests/fixtures/
   - Keep backend-specific requirements.txt

3. Root Configuration
   - Root package.json for workspace management
   - Minimal .eslintrc.js with essential rules
   - Simple .prettierrc for code formatting

## Testing Strategy
1. Frontend Tests
   - Tests alongside components in __tests__/ directories
   - Shared test utilities in frontend/src/__tests__/utils/
   - Centralized mock setup in frontend/src/__tests__/mocks/

2. Backend Tests
   - Organized by module in backend/tests/
   - Fixtures in backend/tests/fixtures/
   - Shared test utilities in backend/tests/utils/

## Build and Development
1. Scripts
   ```json
   {
     "scripts": {
       "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
       "dev:frontend": "cd frontend && npm run dev",
       "dev:backend": "cd backend && python -m uvicorn main:app --reload",
       "test": "npm run test:frontend && npm run test:backend",
       "test:frontend": "cd frontend && npm run test",
       "test:backend": "cd backend && pytest",
       "lint": "eslint .",
       "format": "prettier --write ."
     }
   }
   ```

2. Dependencies
   - Root: Development tools and shared dependencies
   - Frontend: React and UI-specific packages
   - Backend: Python requirements

## Code Quality
1. Essential Linting
   - ESLint with airbnb-base (no TypeScript rules)
   - Prettier for consistent formatting
   - Focus on code clarity and maintainability

2. Minimal Pre-commit Hooks
   ```json
   {
     "pre-commit": [
       "npm run lint",
       "npm run test"
     ]
   }
   ```

## Implementation Phases
1. Phase 1: Directory Restructure
   - Move frontend code to new structure
   - Move backend code to new structure
   - Create shared directory

2. Phase 2: Configuration
   - Update build configs
   - Move test setups
   - Update import paths

3. Phase 3: Testing
   - Reorganize test files
   - Update test utilities
   - Fix broken imports

4. Phase 4: Quality Tools
   - Add minimal ESLint config
   - Add Prettier config
   - Set up basic pre-commit hook

## Migration Strategy
1. Create new directory structure
2. Move files incrementally
3. Update imports as files are moved
4. Test each section after migration
5. Clean up old directories
6. Update documentation

## Success Metrics
- All tests passing
- No duplicate code
- Clear import paths
- Fast development workflow
- Minimal tooling overhead 