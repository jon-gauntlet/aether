from typing import Dict, Set, Optional, List
from datetime import datetime
import asyncio
import logging
from dataclasses import dataclass
from fastapi import WebSocket

@dataclass
class ChannelConfig:
    """Configuration for a channel"""
    name: str
    max_connections: int = 100
    message_rate_limit: int = 100  # messages per minute
    require_auth: bool = True
    permissions: Dict[str, Set[str]] = None  # user_id -> permissions

class Channel:
    """Represents a single channel in the WebSocket system"""
    def __init__(self, name: str, config: ChannelConfig):
        self.name = name
        self.config = config
        self.connections: Dict[str, WebSocket] = {}  # client_id -> websocket
        self.user_ids: Dict[str, str] = {}  # client_id -> user_id
        self.typing_users: Set[str] = set()
        self.message_counts: Dict[str, int] = {}  # user_id -> count
        self.last_reset = datetime.now()
        self.logger = logging.getLogger(__name__)

    async def add_connection(self, client_id: str, user_id: str, websocket: WebSocket) -> bool:
        """Add a connection to the channel"""
        if len(self.connections) >= self.config.max_connections:
            return False
        
        if self.config.require_auth and not self._has_permission(user_id, "connect"):
            return False

        self.connections[client_id] = websocket
        self.user_ids[client_id] = user_id
        return True

    async def remove_connection(self, client_id: str):
        """Remove a connection from the channel"""
        if client_id in self.connections:
            del self.connections[client_id]
            user_id = self.user_ids.pop(client_id, None)
            if user_id and user_id in self.typing_users:
                self.typing_users.remove(user_id)

    async def broadcast(self, message: dict, exclude: Optional[str] = None):
        """Broadcast a message to all connections in the channel"""
        for client_id, websocket in self.connections.items():
            if client_id != exclude:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    self.logger.error(f"Error broadcasting to {client_id}: {e}")

    def can_send_message(self, user_id: str) -> bool:
        """Check if a user can send a message (rate limiting)"""
        if not self._has_permission(user_id, "send_message"):
            return False

        now = datetime.now()
        if (now - self.last_reset).total_seconds() >= 60:
            self.message_counts.clear()
            self.last_reset = now

        count = self.message_counts.get(user_id, 0)
        return count < self.config.message_rate_limit

    def increment_message_count(self, user_id: str):
        """Increment the message count for a user"""
        self.message_counts[user_id] = self.message_counts.get(user_id, 0) + 1

    def update_typing(self, user_id: str, is_typing: bool):
        """Update typing status for a user"""
        if is_typing:
            self.typing_users.add(user_id)
        else:
            self.typing_users.discard(user_id)

    def get_active_users(self) -> Set[str]:
        """Get set of active user IDs in the channel"""
        return set(self.user_ids.values())

    def get_typing_users(self) -> Set[str]:
        """Get set of users currently typing"""
        return self.typing_users.copy()

    def _has_permission(self, user_id: str, permission: str) -> bool:
        """Check if a user has a specific permission"""
        if not self.config.permissions:
            return True
        user_permissions = self.config.permissions.get(user_id, set())
        return permission in user_permissions

class ChannelManager:
    """Manages all channels in the WebSocket system"""
    def __init__(self):
        self.channels: Dict[str, Channel] = {}
        self.logger = logging.getLogger(__name__)

    def create_channel(self, config: ChannelConfig) -> Channel:
        """Create a new channel"""
        if config.name in self.channels:
            raise ValueError(f"Channel {config.name} already exists")
        
        channel = Channel(config.name, config)
        self.channels[config.name] = channel
        return channel

    def get_channel(self, name: str) -> Optional[Channel]:
        """Get a channel by name"""
        return self.channels.get(name)

    def delete_channel(self, name: str):
        """Delete a channel"""
        if name in self.channels:
            del self.channels[name]

    async def broadcast_system_message(self, message: dict):
        """Broadcast a system message to all channels"""
        for channel in self.channels.values():
            await channel.broadcast({
                "type": "system",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })

    def get_channel_metrics(self) -> dict:
        """Get metrics for all channels"""
        metrics = {}
        for name, channel in self.channels.items():
            metrics[name] = {
                "connections": len(channel.connections),
                "active_users": len(channel.get_active_users()),
                "typing_users": len(channel.get_typing_users())
            }
        return metrics 