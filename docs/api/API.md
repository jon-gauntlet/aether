<<<<<<< HEAD
# Aether WebSocket API Documentation


## WebSocket Endpoints

### Main WebSocket Connection
```
ws://[host]/ws
```

#### Connection Parameters
- `token`: JWT authentication token
- `client_id`: Unique client identifier
- `channel`: Initial channel to join

#### Example
```javascript
const ws = new WebSocket('ws://api.example.com/ws?token=<jwt>&client_id=<id>&channel=main');
```

### Message Formats

#### Connection Messages
```json
{
  "type": "connection",
  "action": "connect|disconnect",
  "data": {
    "client_id": "string",
    "user_id": "string",
    "channel": "string"
  }
}
```

#### Channel Messages
```json
{
  "type": "message",
  "action": "send|retry",
  "data": {
    "content": "string",
    "channel": "string",
    "metadata": {
      "sequence": "number",
      "timestamp": "string"
    }
  }
}
```

#### System Messages
```json
{
  "type": "system",
  "action": "status|broadcast",
  "data": {
    "message": "string",
    "severity": "info|warning|error"
  }
}
```

### Error Responses
```json
{
  "type": "error",
  "code": "string",
  "message": "string",
  "details": {
    "component": "string",
    "reason": "string"
  }
}
```

## REST Endpoints

### Status Check
```
GET /ws/status
```
Returns WebSocket system status and metrics.

#### Response
```json
{
  "status": "healthy|degraded|down",
  "connections": {
    "active": "number",
    "total": "number"
  },
  "channels": {
    "active": "number",
    "messages_per_second": "number"
=======
# Auth & Files API Documentation

## Authentication

### Sign In
```typescript
POST /auth/sign-in
Content-Type: application/json

{
  "email": string,
  "password": string
}

Response:
{
  "user": {
    "id": string,
    "email": string,
    "created_at": string
  },
  "session": {
    "access_token": string,
    "expires_at": number
>>>>>>> feature/auth-files
  }
}
```

<<<<<<< HEAD
### Channel Management
```
POST /ws/channels
```
Create or configure channels.

#### Request
```json
{
  "name": "string",
  "max_connections": "number",
  "message_rate_limit": "number",
  "require_auth": "boolean"
}
```

## Client Integration

### Connection Management
```javascript
class WebSocketClient {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
=======
### Sign Up
```typescript
POST /auth/sign-up
Content-Type: application/json

{
  "email": string,
  "password": string
}

Response:
{
  "user": {
    "id": string,
    "email": string,
    "created_at": string
  },
  "session": {
    "access_token": string,
    "expires_at": number
>>>>>>> feature/auth-files
  }
}
```

<<<<<<< HEAD
### Message Handling
```javascript
function sendMessage(channel, content) {
  const message = {
    type: 'message',
    action: 'send',
    data: {
      content,
      channel,
      metadata: {
        sequence: getNextSequence(),
        timestamp: new Date().toISOString()
      }
    }
  };
  ws.send(JSON.stringify(message));
}
```

### Error Handling
```javascript
function handleError(error) {
  console.error('WebSocket error:', error);
  if (this.ws.readyState === WebSocket.CLOSED) {
    this.reconnect();
  }
}

function reconnect() {
  if (this.reconnectAttempts < this.options.maxRetries) {
    setTimeout(() => {
      this.connect();
      this.reconnectAttempts++;
    }, getBackoffDelay(this.reconnectAttempts));
  }
}
```

## Security Guidelines

### Authentication
1. Always use HTTPS/WSS in production
2. Include JWT token in connection URL
3. Validate token on every message
4. Implement token refresh mechanism

### Rate Limiting
1. Connection limits per user
2. Message rate limits per channel
3. Global rate limits for system stability
4. Exponential backoff for reconnection

### Error Handling
1. Validate all incoming messages
2. Sanitize all outgoing messages
3. Log security events
4. Implement proper error recovery

## Deployment Configuration

### Environment Variables
```bash
# WebSocket Configuration
WS_HOST=0.0.0.0
WS_PORT=8000
WS_PATH=/ws

# Security Settings
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRES_S=3600

# Rate Limiting
RATE_LIMIT_CONNECTIONS=100
RATE_LIMIT_MESSAGES=50
RATE_LIMIT_WINDOW_S=60

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Production Checklist
1. Configure SSL certificates
2. Set up load balancer
3. Configure monitoring
4. Set up logging
5. Configure backups
6. Test recovery procedures

## Monitoring Integration

### Metrics Endpoints
```
GET /metrics/connections
GET /metrics/messages
GET /metrics/channels
GET /metrics/errors
```

### Health Check
```
GET /health
```

### Logging Format
```json
{
  "timestamp": "ISO-8601",
  "level": "info|warn|error",
  "event": "string",
  "data": {
    "component": "string",
    "details": "object"
=======
### Sign Out
```typescript
POST /auth/sign-out
Authorization: Bearer <access_token>

Response:
{
  "success": true
}
```

## File Storage

### Upload File
```typescript
POST /storage/upload
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

Form Data:
- file: File
- bucket: string
- path: string

Response:
{
  "path": string,
  "url": string,
  "size": number,
  "mime_type": string,
  "created_at": string
}
```

### List Files
```typescript
GET /storage/list?bucket=<bucket>&path=<path>
Authorization: Bearer <access_token>

Response:
{
  "files": [
    {
      "name": string,
      "path": string,
      "size": number,
      "mime_type": string,
      "created_at": string,
      "url": string
    }
  ],
  "folders": [
    {
      "name": string,
      "path": string
    }
  ]
}
```

### Delete File
```typescript
DELETE /storage/delete
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bucket": string,
  "path": string
}

Response:
{
  "success": true
}
```

## Real-time Events

### File Changes
```typescript
// Subscribe to file changes in a folder
realtimeClient.subscribeToFiles(folderId, {
  onInsert: (file) => void,
  onUpdate: (newFile, oldFile) => void,
  onDelete: (file) => void,
  onError: (error) => void
})
```

### Storage Events
```typescript
// Subscribe to storage events in a bucket
realtimeClient.subscribeToStorage(bucket, {
  onInsert: (event) => void,
  onUpdate: (newEvent, oldEvent) => void,
  onDelete: (event) => void,
  onError: (error) => void
})
```

### Auth Events
```typescript
// Subscribe to auth events for a user
realtimeClient.subscribeToAuth(userId, {
  onInsert: (event) => void,
  onUpdate: (newEvent, oldEvent) => void,
  onDelete: (event) => void,
  onError: (error) => void
})
```

## Error Handling

All API endpoints return errors in the following format:

```typescript
{
  "error": {
    "message": string,
    "code": string,
    "status": number
>>>>>>> feature/auth-files
  }
}
```

<<<<<<< HEAD
## Development Guidelines

### Testing
1. Run unit tests: `npm test`
2. Run integration tests: `npm run test:integration`
3. Run load tests: `npm run test:load`

### Local Development
1. Start server: `npm run dev`
2. Watch mode: `npm run dev:watch`
3. Debug mode: `npm run dev:debug`

### Code Style
Follow established patterns for:
1. Message formatting
2. Error handling
3. Event naming
4. Documentation 
=======
Common error codes:
- `auth/invalid-credentials`: Invalid email or password
- `auth/email-already-exists`: Email is already registered
- `auth/weak-password`: Password is too weak
- `auth/expired-token`: Session has expired
- `storage/file-too-large`: File exceeds size limit
- `storage/invalid-type`: Invalid file type
- `storage/quota-exceeded`: Storage quota exceeded
- `storage/not-found`: File or folder not found

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Storage endpoints: 100 requests per minute
- Real-time connections: 10 concurrent connections per user

## WebSocket Events

Events are delivered in the following format:

```typescript
{
  "eventType": "INSERT" | "UPDATE" | "DELETE" | "ERROR",
  "table": string,
  "schema": "public",
  "new": Record<string, any> | null,
  "old": Record<string, any> | null,
  "timestamp": number
}
```

## Environment Variables

Required environment variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAX_FILE_SIZE=5242880 # 5MB in bytes
VITE_ALLOWED_FILE_TYPES=image/*,application/pdf,.doc,.docx
VITE_UPLOAD_BUCKET=files
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to production:
```bash
npm run deploy
```

## Testing

Run tests:
```bash
npm test                 # Run all tests
npm run test:unit       # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:coverage   # Generate coverage report
``` 
>>>>>>> feature/auth-files
