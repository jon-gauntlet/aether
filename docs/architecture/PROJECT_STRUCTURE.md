# Aether Project Structure

## Core Directories

### `/src` - Core Application Code
- `src/components/` - React components
  - `Chat/` - Chat-related components
  - `Message/` - Message components and utilities
  - `ui/` - Reusable UI components
- `src/core/` - Core business logic
  - `reactions/` - Reaction system
  - `spaces/` - Space management
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `src/rag_system/` - RAG (Retrieval-Augmented Generation) implementation

### `/frontend` - Frontend Application
- `pages/` - Next.js/Vercel pages
- `public/` - Static assets
- Components mirror the structure in `/src`

### `/config` - Configuration Files
- `deployment/` - Deployment configurations (Vercel, nginx)
- `firebase/` - Firebase configurations
- `frontend/` - Frontend build configs (Vite, Vitest, Tailwind)
- `git/` - Git hooks and configs
- `python/` - Python environment configs
- `supabase/` - Supabase database configs
- `test/` - Test configurations

### `/tests` - Test Files
- Unit tests
- Integration tests
- Test utilities

### `/scripts` - Utility Scripts
- Development scripts
- Deployment scripts
- Environment setup

### `/docs` - Documentation
- `archive/` - Historical documentation
- `brainlifts/` - BrainLifts integration docs
- Technical documentation
- API documentation

### `/infrastructure-config` - Infrastructure
- Infrastructure as Code
- Deployment configurations
- Service configurations

## Special Directories
- `.patches/` - Git patches for feature implementations
- `.github/` - GitHub workflows and templates
- `.vercel/` - Vercel deployment configs

## Key Files
- `package.json` - Node.js dependencies and scripts
- `.cursorrules` - Cursor IDE configuration
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE` - Project license

## Component Architecture

### Core Components
1. **Chat System**
   - `ChatContainer` - Main chat container
   - `ChatInput` - Message input
   - `ChatMessageList` - Message display
   - `Message` - Individual message component

2. **Space System**
   - `SpacePatterns` - Space management patterns
   - `SpaceList` - Available spaces
   - `SpaceTransition` - Space transition handling

3. **Reaction System**
   - `ReactionProvider` - Reaction context provider
   - `ReactionDisplay` - Reaction visualization

4. **UI Components**
   - `ThemeToggle` - Dark/light mode toggle
   - `ErrorBoundary` - Error handling
   - `FileUpload` - File upload handling

## Development Guidelines
1. All new components should be placed in appropriate directories under `/src`
2. Tests should mirror the structure of the code they're testing
3. Configuration changes should be made in `/config`
4. Documentation should be updated in `/docs` 