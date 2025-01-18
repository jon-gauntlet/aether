# Chat Interface Demo Path

## Setup
1. Start backend server (localhost:8100)
2. Start frontend dev server
3. Open in Chrome and Firefox for cross-browser testing

## Demo Flow
1. Initial Load
   - Verify welcome message appears
   - Check responsive layout

2. Basic Chat
   - Send: "Hello, how are you?"
   - Verify response and styling

3. Code Example
   - Send: "Show me a Python function"
   - Verify markdown formatting
   - Check code block styling

4. Error Handling
   - Disconnect backend temporarily
   - Send message
   - Verify error display
   - Reconnect backend
   - Verify recovery

5. Mobile View
   - Use Chrome DevTools mobile view
   - Test input and scrolling
   - Verify message layout

## Fallbacks
1. Backend Down
   - Use error messages
   - Clear explanation to user
   
2. Formatting Issues
   - Fallback to plain text
   - Preserve readability

3. Browser Issues
   - Works in basic mode on all browsers
   - Graceful degradation of styles 