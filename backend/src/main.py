from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
from datetime import datetime

from .models.message import Message
from .services.messages import MessageService

app = FastAPI()
message_service = MessageService()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.connection_count = 0

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        self.connection_count += 1

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].remove(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
            self.connection_count -= 1

    async def broadcast(self, message: dict, channel: str):
        if channel in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except:
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                self.disconnect(dead, channel)

    def get_channel_connection_count(self, channel: str) -> int:
        return len(self.active_connections.get(channel, []))

    def get_total_connection_count(self) -> int:
        return self.connection_count

manager = ConnectionManager()

@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_json()
            message = Message(
                id=str(datetime.now().timestamp()),
                channel=channel,
                content=data.get("content", ""),
                user_id=data.get("user_id", "anonymous"),
                timestamp=datetime.now()
            )
            
            # Store the message
            await message_service.add_message(channel, message)
            
            # Broadcast to all connected clients in the channel
            await manager.broadcast(message.model_dump(), channel)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        print(f"Error in websocket connection: {str(e)}")
        manager.disconnect(websocket, channel)

@app.get("/api/messages/{channel}")
async def get_messages(channel: str):
    messages = await message_service.get_messages(channel)
    return [msg.model_dump() for msg in messages]

@app.get("/api/status")
async def get_status():
    return {
        "total_connections": manager.get_total_connection_count(),
        "channels": {
            channel: len(connections)
            for channel, connections in manager.active_connections.items()
        }
    }
