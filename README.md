# Natural Structure Chat Application

A chat application built using natural flow patterns and simple, maintainable structures.

## Natural Structure

The application follows a natural structure pattern:

```
/src
  /chat          # Chat feature
    /components  # UI components
    /hooks       # Logic and state
    /api         # External communication
    /tests       # Feature tests
    
  /search        # Search feature
    /components  # UI components
    /hooks       # Logic and state
    /api         # External communication
    /tests       # Feature tests
    
  /shared        # Shared components
    /components  # Reusable UI elements
```

## Natural Flows

### Chat Flow
```
Message → Process → Response
- User inputs message
- Message processed
- Response displayed
```

### Search Flow
```
Query → Search → Results
- User enters query
- Search executed
- Results displayed
```

### Error Flow
```
Error → Capture → Display
- Error occurs
- ErrorBoundary captures
- User-friendly display
```

## Components

### Chat Components
- `Chat`: Main chat interface
- `Message`: Individual message display
- `Input`: Message input field

### Search Components
- `Search`: Search interface
- `SearchResult`: Individual result display

### Shared Components
- `Button`: Reusable button with variants
- `Input`: Reusable input field
- `ErrorBoundary`: Error handling wrapper

## Testing

Each component follows a natural testing flow:
```
Setup → Action → Verify
```

Example:
```javascript
describe('Component', () => {
  it('handles action', () => {
    // Setup
    render(<Component />)
    
    // Action
    fireEvent.click(...)
    
    // Verify
    expect(...).toBeInTheDocument()
  })
})
```

## Development

1. Clone repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Start development: `npm start`

## Natural Patterns

- Each feature is self-contained
- Components follow single responsibility
- State flows naturally down
- Errors bubble up naturally
- Tests mirror natural use 