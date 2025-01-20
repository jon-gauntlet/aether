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
  }
}
```

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
  }
}
```

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
  }
}
```

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