"""WebSocket connection manager."""
import logging
from datetime import datetime
from fastapi import WebSocket
from typing import Dict, Set, Optional, Any
from src.websocket.storage import Storage

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manage WebSocket connections."""
    def __init__(self, storage: Storage):
        """Initialize the connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_presence: Dict[str, datetime] = {}  # user_id -> last_active
        self.typing_users: Set[str] = set()
        self.storage = storage

    def _format_message(self, message: Any) -> dict:
        """Format a message for sending."""
        return {
            "id": message.id,
            "content": message.content,
            "user_id": message.user_id,
            "timestamp": message.timestamp.isoformat(),
            "parent_id": message.parent_id,
            "reactions": [
                {
                    "user_id": r.user_id,
                    "emoji": r.emoji
                } for r in message.reactions
            ],
            "reply_count": len(message.replies) if message.replies is not None else 0
        }

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a new client."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_presence[user_id] = datetime.utcnow()

        # Send message history
        messages = await self.storage.get_recent_messages()
        await websocket.send_json({
            "type": "history",
            "messages": [self._format_message(msg) for msg in messages]
        })

        # Broadcast user's presence to others
        await self.broadcast({
            "type": "presence",
            "user_id": user_id,
            "status": "online",
            "timestamp": self.user_presence[user_id].isoformat()
        }, exclude=user_id)

    async def disconnect(self, user_id: str):
        """Disconnect a client."""
        if user_id in self.active_connections:
            await self.active_connections[user_id].close()
            del self.active_connections[user_id]
            last_seen = self.user_presence.pop(user_id, None)
            self.typing_users.discard(user_id)

            # Broadcast offline status
            if last_seen:
                await self.broadcast({
                    "type": "presence",
                    "user_id": user_id,
                    "status": "offline",
                    "timestamp": last_seen.isoformat()
                })

    async def broadcast(self, message: dict, exclude: Optional[str] = None):
        """Broadcast a message to all connected clients."""
        disconnected_users = []
        for user_id, connection in self.active_connections.items():
            if user_id != exclude:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {str(e)}")
                    disconnected_users.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def handle_message(self, user_id: str, content: str, parent_id: Optional[int] = None):
        """Handle a new message."""
        message = await self.storage.save_message(content, user_id, parent_id)
        self.user_presence[user_id] = datetime.utcnow()
        
        # Broadcast the message
        await self.broadcast(
            {
                "type": "message",
                **self._format_message(message)
            }
        )

    async def get_thread(self, message_id: int):
        """Get messages in a thread."""
        parent = await self.storage.get_message(message_id)
        if not parent:
            return None

        replies = await self.storage.get_thread_messages(message_id)
        return {
            "parent": self._format_message(parent),
            "replies": [self._format_message(reply) for reply in replies]
        }

    async def handle_reaction(self, user_id: str, message_id: int, emoji: str):
        """Handle a reaction to a message."""
        reaction = await self.storage.add_reaction(message_id, user_id, emoji)
        if reaction:
            self.user_presence[user_id] = datetime.utcnow()
            await self.broadcast({
                "type": "reaction",
                "message_id": message_id,
                "user_id": user_id,
                "emoji": emoji
            })

    async def remove_reaction(self, user_id: str, message_id: int, emoji: str):
        """Remove a reaction from a message."""
        removed = await self.storage.remove_reaction(message_id, user_id, emoji)
        if removed:
            self.user_presence[user_id] = datetime.utcnow()
            await self.broadcast({
                "type": "remove_reaction",
                "message_id": message_id,
                "user_id": user_id,
                "emoji": emoji
            })

    async def set_typing(self, user_id: str, is_typing: bool):
        """Set a user's typing status."""
        if is_typing:
            self.typing_users.add(user_id)
        else:
            self.typing_users.discard(user_id)

        self.user_presence[user_id] = datetime.utcnow()
        await self.broadcast({
            "type": "typing",
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": self.user_presence[user_id].isoformat()
        }, exclude=user_id) 