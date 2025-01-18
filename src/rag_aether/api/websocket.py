"""WebSocket handling for real-time chat."""

from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from ..core.conversation import ConversationManager

class ConnectionManager:
    """Manage WebSocket connections and message broadcasting."""
    
    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # channel -> connections
        self.conversation_manager = ConversationManager()
    
    async def connect(self, websocket: WebSocket, channel: str):
        """Accept connection and add to channel group."""
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        """Remove connection from channel group."""
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
    
    async def broadcast_to_channel(self, message: dict, channel: str):
        """Broadcast message to all connections in channel."""
        if channel not in self.active_connections:
            return
            
        # Store message in conversation history
        self.conversation_manager.add_message(
            conversation_id=channel,
            content=message["content"],
            role=message["username"],
            metadata={
                "timestamp": message["timestamp"],
                "channel": channel
            }
        )
        
        # Broadcast to all connections in channel
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(connection, channel)

manager = ConnectionManager() 