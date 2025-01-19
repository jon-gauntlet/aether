# Aether Architecture

## System Overview
```
[Client Browser] <--WebSocket--> [Frontend Server] <--HTTP/WS--> [Backend Server] <---> [Supabase]
                                                                        |
                                                                        v
                                                                  [RAG System]
```

## Core Systems

### 1. Frontend (React + Vite)
- Location: `/frontend`
- Key Components:
  ```
  /components
  ├── chat/
  │   ├── ChatContainer.jsx    # Main chat interface container
  │   ├── ChatInput.jsx        # Message input with file upload
  │   ├── ChatMessageList.jsx  # Real-time message display
  │   ├── Message.jsx          # Individual message component
  │   └── ReactionDisplay.jsx  # Emoji reactions
  └── auth/
      └── Auth.jsx             # Authentication interface
  ```

### 2. Backend (FastAPI)
- Location: `/backend`
- Core Services:
  ```
  /src
  ├── api/          # FastAPI routes
  ├── core/         # Business logic
  └── services/     # External integrations
  ```

### 3. RAG System
- Location: `/rag_aether`
- Components:
  ```
  /rag_aether
  ├── core/         # Core RAG logic
  ├── embeddings/   # Vector operations
  └── services/     # OpenAI integration
  ```

### 4. Database (Supabase)
- Tables:
  ```sql
  messages
    - id: uuid
    - content: text
    - user_id: uuid
    - channel_id: uuid
    - created_at: timestamp
    - vector: vector(1536)

  channels
    - id: uuid
    - name: text
    - type: enum('public', 'private', 'dm')

  reactions
    - id: uuid
    - message_id: uuid
    - user_id: uuid
    - emoji: text
  ```

## Real-Time Communication
1. WebSocket Connections:
   - Browser ←→ Frontend: React state updates
   - Frontend ←→ Backend: Supabase real-time
   - Backend ←→ Database: Supabase subscriptions

2. Message Flow:
   ```
   [User Input] → [ChatInput] → [Backend API] → [Supabase]
                                      ↓
                                [RAG Process]
                                      ↓
   [Display] ← [ChatMessageList] ← [WebSocket] ← [Supabase]
   ```

## Testing Structure
```
/frontend
└── tests/
    ├── unit/          # Component tests
    ├── integration/   # Feature tests
    └── e2e/          # Full flow tests

/backend
└── tests/
    ├── unit/         # Function tests
    ├── integration/  # API tests
    └── fixtures/     # Test data
```

## Security
1. Authentication: Supabase Auth
2. Authorization: Row Level Security
3. API Security: JWT validation
4. WebSocket: Secure token-based connections

## Performance Optimizations
1. Frontend:
   - Message virtualization
   - Optimistic updates
   - Debounced input

2. Backend:
   - Connection pooling
   - Query optimization
   - Caching layer

3. RAG System:
   - Vector caching
   - Batch processing
   - Result memoization
