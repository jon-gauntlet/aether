# API Documentation

## Authentication

### POST /api/auth/login
Login with email and password

### POST /api/auth/logout
Logout current user

### GET /api/auth/me
Get current user information

## Chat

### GET /api/channels
List available channels

### GET /api/channels/{channel_id}/messages
Get messages for a channel

### POST /api/channels/{channel_id}/messages
Send a message to a channel

### POST /api/messages/{message_id}/reactions
Add reaction to a message

## Files

### POST /api/files/upload
Upload a file

### GET /api/files/{file_id}
Download a file

## AI Features

### POST /api/rag/query
Query the RAG system

### GET /api/ai/avatar/{user_id}
Get AI avatar for user

### POST /api/ai/avatar/generate
Generate AI response for user 