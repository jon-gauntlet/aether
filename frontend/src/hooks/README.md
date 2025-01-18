# Frontend Hooks

This directory contains React hooks used throughout the Aether frontend.

## Current Hooks

### useRealTimeUpdates
Real-time WebSocket connection management hook that provides:
- Connection status tracking
- Automatic reconnection
- Message sending/receiving
- Error handling with toast notifications

Example usage:
```jsx
const { isConnected, sendMessage } = useRealTimeUpdates('ws://localhost:8000/ws', {
  onMessage: (data) => {
    console.log('Received:', data);
  }
});
```

## Future Hooks (Turtle 2+)

### useRAG (Planned)
Hook for interacting with the RAG system:
- Document querying
- Context-aware responses
- Message history management

### useAIStandIn (Planned)
Hook for managing AI stand-in features:
- Vacation mode activation
- Response style configuration
- Context management

## Development Guidelines

1. **Reusability**: Hooks should be generic enough to be reused across components
2. **Error Handling**: Include proper error handling and user feedback
3. **Documentation**: Each hook should include usage examples
4. **Testing**: Maintain test coverage for all hooks 