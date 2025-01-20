from typing import Dict, Set, Optional, List
import asyncio
import logging
from datetime import datetime, timedelta
from fastapi import WebSocket
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class PoolConfig(BaseModel):
    """Configuration for the connection pool."""
    max_connections: int = 1000
    max_connections_per_channel: int = 100
    max_channels: int = 100
    message_buffer_size: int = 100
    cleanup_interval: int = 300  # 5 minutes

class Channel:
    """Represents a channel in the connection pool."""
    def __init__(self, name: str, buffer_size: int = 100):
        self.name = name
        self.connections: Set[WebSocket] = set()
        self.buffer_size = buffer_size
        self.message_buffer: List[dict] = []
        self.last_activity = datetime.utcnow()

    def add_connection(self, websocket: WebSocket):
        """Add a connection to the channel."""
        self.connections.add(websocket)
        self.last_activity = datetime.utcnow()

    def remove_connection(self, websocket: WebSocket):
        """Remove a connection from the channel."""
        self.connections.discard(websocket)
        self.last_activity = datetime.utcnow()

    def add_message(self, message: dict):
        """Add a message to the channel buffer."""
        self.message_buffer.append(message)
        if len(self.message_buffer) > self.buffer_size:
            self.message_buffer.pop(0)
        self.last_activity = datetime.utcnow()

    def get_recent_messages(self, limit: int = None) -> List[dict]:
        """Get recent messages from the channel buffer."""
        if limit is None:
            return self.message_buffer
        return self.message_buffer[-limit:]

class ConnectionPool:
    """Manages WebSocket connections and channels."""
    def __init__(self, config: Optional[PoolConfig] = None):
        self.config = config or PoolConfig()
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.channel_buffers: Dict[str, List[dict]] = {}
        self.total_connections: int = 0
        self.last_activity: Dict[str, datetime] = {}

    async def add_connection(self, websocket: WebSocket, channel: str) -> bool:
        """Add a connection to a channel."""
        # Check global connection limit
        if self.total_connections >= self.config.max_connections:
            return False
            
        # Check channel limit
        if channel not in self.connections:
            if len(self.connections) >= self.config.max_channels:
                return False
            self.connections[channel] = set()
            self.channel_buffers[channel] = []
            
        if len(self.connections[channel]) >= self.config.max_connections_per_channel:
            return False
            
        # Add connection
        self.connections[channel].add(websocket)
        self.total_connections += 1
        self.last_activity[channel] = datetime.utcnow()
        return True

    async def remove_connection(self, websocket: WebSocket, channel: str):
        """Remove a connection from a channel."""
        if channel in self.connections and websocket in self.connections[channel]:
            self.connections[channel].remove(websocket)
            self.total_connections -= 1
            
            # Clean up empty channel
            if not self.connections[channel]:
                del self.connections[channel]
                del self.channel_buffers[channel]
                if channel in self.last_activity:
                    del self.last_activity[channel]

    async def broadcast_to_channel(
        self,
        channel: str,
        message: dict,
        exclude: Optional[WebSocket] = None
    ):
        """Broadcast a message to all connections in a channel."""
        if channel not in self.connections:
            return
            
        # Add to channel buffer
        self.channel_buffers[channel].append(message)
        if len(self.channel_buffers[channel]) > self.config.message_buffer_size:
            self.channel_buffers[channel].pop(0)
            
        # Update activity
        self.last_activity[channel] = datetime.utcnow()
        
        # Broadcast to all connections
        for connection in self.connections[channel]:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except Exception:
                    await self.remove_connection(connection, channel)

    def get_metrics(self) -> dict:
        """Get connection pool metrics."""
        now = datetime.utcnow()
        return {
            "total_connections": self.total_connections,
            "total_channels": len(self.connections),
            "channels": {
                channel: {
                    "connections": len(connections),
                    "buffer_size": len(self.channel_buffers[channel]),
                    "last_activity": self.last_activity[channel].isoformat()
                }
                for channel, connections in self.connections.items()
            }
        }

    async def cleanup(self):
        """Clean up inactive channels and connections."""
        now = datetime.utcnow()
        timeout = timedelta(seconds=self.config.cleanup_interval)
        
        for channel in list(self.connections.keys()):
            if now - self.last_activity[channel] > timeout:
                # Channel is inactive, close all connections
                for connection in self.connections[channel]:
                    try:
                        await connection.close(code=4000, reason="Channel inactive")
                    except Exception:
                        pass
                del self.connections[channel]
                del self.channel_buffers[channel]
                del self.last_activity[channel]
                self.total_connections -= len(self.connections[channel])

    async def get_channel_connections(self, channel_name: str) -> Set[WebSocket]:
        """Get all connections in a channel."""
        if channel_name not in self.connections:
            return set()
        return self.connections[channel_name].copy()

    async def get_channel_history(
        self,
        channel_name: str,
        limit: Optional[int] = None
    ) -> List[dict]:
        """Get message history for a channel."""
        if channel_name not in self.channel_buffers:
            return []
        return self.channel_buffers[channel_name][-limit:] 