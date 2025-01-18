from fastapi import FastAPI, WebSocket, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json

from .services.messages import MessageService
from .models.message import Message

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections
connections: Dict[str, List[WebSocket]] = {}

@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await websocket.accept()
    if channel not in connections:
        connections[channel] = []
    connections[channel].append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Broadcast to all connected clients in the channel
            for connection in connections[channel]:
                await connection.send_text(json.dumps(message))
    except:
        connections[channel].remove(websocket)
        if not connections[channel]:
            del connections[channel]

@app.get("/api/messages/{channel}")
async def get_messages(channel: str):
    try:
        messages = await MessageService.get_messages(channel)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/messages")
async def create_message(message: Message):
    try:
        result = await MessageService.create_message(message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
