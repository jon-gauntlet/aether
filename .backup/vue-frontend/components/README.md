# Aether Frontend Components

## Directory Structure

```
src/components/
├── Message/                 # Core message components
│   ├── __tests__/          # Message-specific tests
│   ├── index.jsx           # Public exports
│   ├── Message.jsx         # Main message component
│   └── MessageContent.jsx  # Content renderer
├── reactions/              # Reaction system
│   ├── ReactionDisplay.jsx # Main reaction component
│   └── __tests__/         # Reaction-specific tests
├── Chat/                   # Chat implementations
│   ├── Chat.jsx           # Advanced chat
│   └── BasicChat.jsx      # Simple chat
└── shared/                # Shared components
    ├── ErrorBoundary/     # Error handling
    └── layout/            # Layout components
```

## Core Components

### Message System (`/Message`)
- `Message.jsx` - Base message component with:
  - Content rendering via `MessageContent`
  - Timestamp formatting
  - Loading states
  - Thread indicators
  - Integration with reactions

- `MessageContent.jsx` - Content renderer with:
  - Code block handling with syntax highlighting
  - File attachment display
  - Copy functionality
  - Toast notifications

### Reaction System (`/reactions`)
- `ReactionDisplay.jsx` - Advanced reaction system with:
  - Emotion patterns and energy levels
  - Space-aware reactions
  - Animated UI elements
  - Integration with `ReactionProvider`
  - Full test coverage in `ReactionDisplay.test.jsx`

### Chat System (`/Chat`)
Multiple implementations with different features:
1. `Chat.jsx` - Advanced implementation:
   - Space awareness
   - Message clustering
   - Energy field visualization
   - Natural flow protection
   
2. `BasicChat.jsx` - Simpler implementation:
   - Basic messaging
   - Thread support
   - Authentication integration

## Providers (`/core`)

### Message Provider
`messaging/MessageProvider.jsx`:
- Real-time Supabase subscriptions
- Message state management
- Error handling
- Query invalidation

### Reaction Provider
`reactions/ReactionProvider.jsx`:
- Reaction state management
- Emotional pattern tracking
- Space energy integration
- Real-time updates

### Space Provider
`spaces/SpaceProvider.jsx`:
- Space context management
- Energy field calculations
- Natural system integration

## Testing Structure

### Component Tests
Located in `__tests__` directories next to components:
- Unit tests for each component
- Integration with providers
- Mock implementations where needed

### Integration Tests
Located in `src/test`:
- Provider integration
- Real-time functionality
- Error scenarios

### E2E Tests
Located in `src/rag_aether/ai/testing`:
- Full user flows
- API integration
- Performance testing

## Best Practices

1. Component Organization:
   - Keep related files together (component, tests, styles)
   - Use index.jsx for public exports
   - Maintain clear documentation

2. Feature Implementation:
   - Check existing components first
   - Use the most appropriate implementation
   - Follow established patterns

3. Testing:
   - Maintain test coverage
   - Mock external dependencies
   - Test error scenarios

4. Code Style:
   - Clear component documentation
   - Consistent file structure
   - Proper type definitions
   - Error handling 