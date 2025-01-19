from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
from pydantic import BaseModel
import json

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        # Store active connections per channel
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
    
    async def broadcast(self, message: str, channel: str):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(message)
                except:
                    await connection.close()
    
    def get_channel_count(self, channel: str) -> int:
        return len(self.active_connections.get(channel, []))
    
    def get_total_connections(self) -> int:
        return sum(len(connections) for connections in self.active_connections.values())

manager = ConnectionManager()

class Message(BaseModel):
    channel: str
    content: str
    sender: Optional[str] = None

@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_json()
            message = Message(
                channel=channel,
                content=data.get("content", ""),
                sender=data.get("sender")
            )
            await manager.broadcast(json.dumps(message.dict()), channel)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
        message = Message(
            channel=channel,
            content=f"Client #{id(websocket)} left the chat",
            sender="system"
        )
        await manager.broadcast(json.dumps(message.dict()), channel)

@app.get("/api/status")
async def get_status():
    return {
        "total_connections": manager.get_total_connections(),
        "connections_per_channel": {
            channel: len(connections)
            for channel, connections in manager.active_connections.items()
        }
    } 