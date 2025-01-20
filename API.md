# Aether WebSocket API Documentation
Christ is King! ☦

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
  }
}
```

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
  }
}
```

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
  }
}
```

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