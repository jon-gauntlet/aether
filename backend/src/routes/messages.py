from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from ..models.message import Message
from ..services.messages import MessageService
from pydantic import BaseModel

router = APIRouter()
message_service = MessageService()

class MessageCreate(BaseModel):
    content: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].remove(websocket)

    async def broadcast(self, message: Message, channel: str):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                await connection.send_json(message.dict())

manager = ConnectionManager()

@router.websocket("/{channel}/ws")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_json()
            message = Message(
                channel=channel,
                content=data["content"],
                user_id="anonymous",  # For now, until we integrate auth
            )
            message = await message_service.send_message(channel, message)
            await manager.broadcast(message, channel)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)

@router.get("/{channel}", response_model=List[Message])
async def get_messages(channel: str):
    """Get all messages for a channel"""
    try:
        return await message_service.get_messages(channel)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{channel}", response_model=Message)
async def send_message(channel: str, message: MessageCreate):
    """Send a message to a channel"""
    try:
        new_message = Message(
            channel=channel,
            content=message.content,
            user_id="anonymous",  # For now, until we integrate auth
        )
        message = await message_service.send_message(channel, new_message)
        await manager.broadcast(message, channel)  # Broadcast to all connected clients
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 