"""WebSocket connection manager."""
import json
import logging
from datetime import datetime
from typing import Dict, Set

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from .storage import Storage

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self, storage: Storage):
        """Initialize connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.typing_users: Set[str] = set()
        self.storage = storage

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a client."""
        await websocket.accept()
        self.active_connections[user_id] = websocket

        # Send message history
        async with self.storage.async_session() as session:
            async with session.begin():
                messages = await self.storage.get_recent_messages(session)
                formatted_messages = []
                for message in messages:
                    formatted = await message.to_dict()
                    formatted_messages.append(formatted)
                
                await websocket.send_json({
                    "type": "history",
                    "messages": formatted_messages
                })

    async def disconnect(self, user_id: str):
        """Disconnect a client."""
        if user_id in self.active_connections:
            await self.active_connections[user_id].close()
            del self.active_connections[user_id]
            self.typing_users.discard(user_id)

    async def broadcast(self, message: dict, exclude: str = None):
        """Broadcast a message to all connected clients."""
        disconnected_users = []
        for user_id, connection in self.active_connections.items():
            if user_id != exclude:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    disconnected_users.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def handle_message(self, user_id: str, content: str, parent_id: int = None):
        """Handle and broadcast a new message."""
        async with self.storage.async_session() as session:
            async with session.begin():
                message = await self.storage.save_message(session, content, user_id, parent_id)
                formatted_message = await message.to_dict()
                await self.broadcast({
                    "type": "message",
                    **formatted_message
                })
                return message

    async def get_thread(self, message_id: int):
        """Get messages in a thread."""
        async with self.storage.async_session() as session:
            async with session.begin():
                parent = await self.storage.get_message(session, message_id)
                if not parent:
                    return None

                replies = await self.storage.get_thread_messages(session, message_id)
                
                formatted_parent = await parent.to_dict()
                formatted_replies = []
                for reply in replies:
                    formatted = await reply.to_dict()
                    formatted_replies.append(formatted)

                return {
                    "parent": formatted_parent,
                    "replies": formatted_replies
                }

    async def handle_reaction(self, message_id: int, user_id: str, emoji: str):
        """Handle adding a reaction to a message."""
        async with self.storage.async_session() as session:
            async with session.begin():
                if await self.storage.add_reaction(session, message_id, user_id, emoji):
                    message = await self.storage.get_message(session, message_id)
                    if message:
                        formatted_message = await message.to_dict()
                        await self.broadcast({
                            "type": "reaction",
                            **formatted_message
                        })

    async def remove_reaction(self, message_id: int, user_id: str, emoji: str):
        """Handle removing a reaction from a message."""
        async with self.storage.async_session() as session:
            async with session.begin():
                if await self.storage.remove_reaction(session, message_id, user_id, emoji):
                    message = await self.storage.get_message(session, message_id)
                    if message:
                        formatted_message = await message.to_dict()
                        await self.broadcast({
                            "type": "reaction",
                            **formatted_message
                        })

    async def set_typing(self, user_id: str, is_typing: bool):
        """Set user typing status."""
        if is_typing:
            self.typing_users.add(user_id)
        else:
            self.typing_users.discard(user_id)

        await self.broadcast({
            "type": "typing",
            "user_id": user_id,
            "is_typing": is_typing
        }, exclude=user_id) 