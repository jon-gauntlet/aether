from typing import Dict, Set, Optional, List
import asyncio
import logging
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from ..auth import verify_token  # Add auth import
from .storage import MessageStorage

logger = logging.getLogger(__name__)

class Message(BaseModel):
    id: str
    content: str
    user_id: str
    client_id: str
    timestamp: datetime
    type: str = "message"
    retry_count: int = 0
    max_retries: int = 3

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_presence: Dict[str, datetime] = {}
        self.typing_users: Set[str] = set()
        self.failed_messages: Dict[str, List[Message]] = {}
        self.read_receipts: Dict[str, Set[str]] = {}
        self.retry_interval: int = 5  # seconds
        self.user_sessions: Dict[str, Set[str]] = {}  # user_id -> set of client_ids
        self.storage = MessageStorage()

    async def authenticate(self, token: str) -> str:
        """Authenticate WebSocket connection."""
        try:
            user_id = await verify_token(token)
            return user_id
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid authentication")

    async def connect(self, websocket: WebSocket, client_id: str, token: str):
        """Connect a new client with authentication."""
        user_id = await self.authenticate(token)
        
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.user_presence[client_id] = datetime.utcnow()
        self.failed_messages[client_id] = []
        
        # Track user sessions
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = set()
        self.user_sessions[user_id].add(client_id)
        
        # Send recent messages
        recent_messages = await self.storage.get_recent_messages()
        await websocket.send_json({
            'type': 'message_history',
            'messages': recent_messages
        })
        
        # Start message retry task
        asyncio.create_task(self._process_failed_messages(client_id))
        
        # Broadcast presence
        await self.broadcast_presence(client_id, True)
        
        return user_id

    async def disconnect(self, client_id: str):
        """Handle client disconnection."""
        if client_id in self.active_connections:
            # Remove from user sessions
            for user_id, sessions in self.user_sessions.items():
                if client_id in sessions:
                    sessions.remove(client_id)
                    if not sessions:
                        del self.user_sessions[user_id]
                    break
            
            del self.active_connections[client_id]
            
        if client_id in self.user_presence:
            del self.user_presence[client_id]
        if client_id in self.typing_users:
            self.typing_users.remove(client_id)
        if client_id in self.failed_messages:
            del self.failed_messages[client_id]
            
        # Broadcast offline status
        await self.broadcast_presence(client_id, False)

    async def _process_failed_messages(self, client_id: str):
        """Process failed messages for retry."""
        while client_id in self.active_connections:
            if self.failed_messages[client_id]:
                messages_to_retry = self.failed_messages[client_id].copy()
                self.failed_messages[client_id] = []
                
                for message in messages_to_retry:
                    if message.retry_count < message.max_retries:
                        message.retry_count += 1
                        try:
                            await self.active_connections[client_id].send_text(
                                message.json()
                            )
                            logger.info(
                                f"Successfully retried message {message.id} "
                                f"for client {client_id}"
                            )
                        except Exception as e:
                            logger.error(
                                f"Retry failed for message {message.id}: {e}"
                            )
                            self.failed_messages[client_id].append(message)
                    else:
                        logger.warning(
                            f"Message {message.id} exceeded max retries "
                            f"for client {client_id}"
                        )
            
            await asyncio.sleep(self.retry_interval)

    async def send_personal_message(self, message: str, client_id: str):
        """Send a message to a specific client."""
        if client_id in self.active_connections:
            try:
                msg = Message(
                    id=f"{datetime.utcnow().timestamp()}",
                    content=message,
                    user_id=f"{datetime.utcnow().timestamp()}",
                    client_id=client_id,
                    timestamp=datetime.utcnow()
                )
                await self.active_connections[client_id].send_text(msg.json())
            except WebSocketDisconnect:
                await self.disconnect(client_id)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                if client_id in self.failed_messages:
                    self.failed_messages[client_id].append(msg)

    async def broadcast(self, message: dict, exclude: Optional[str] = None):
        """Broadcast a message to all connected clients."""
        # Save message to storage first
        if message.get('type') == 'message':
            if message.get('parent_id'):
                stored_message = await self.storage.create_thread(
                    message['parent_id'], message
                )
            else:
                stored_message = await self.storage.save_message(message)
            message['id'] = stored_message.id
        
        # Broadcast to all connected clients
        for client_id, connection in self.active_connections.items():
            if client_id != exclude:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to {client_id}: {str(e)}")
                    if message.get('type') == 'message':
                        self.failed_messages[client_id].append(Message(**message))

    async def set_typing_status(self, client_id: str, is_typing: bool):
        """Update typing status for a client and notify others."""
        if is_typing:
            self.typing_users.add(client_id)
        else:
            self.typing_users.discard(client_id)
        status_message = {
            "type": "typing_status",
            "client_id": client_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(status_message, exclude=client_id)

    async def mark_as_read(self, client_id: str, message_id: str):
        """Mark a message as read by a client."""
        if message_id not in self.read_receipts:
            self.read_receipts[message_id] = set()
        self.read_receipts[message_id].add(client_id)
        receipt_message = {
            "type": "read_receipt",
            "message_id": message_id,
            "read_by": client_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(receipt_message)

    async def broadcast_presence(self, client_id: str, is_online: bool):
        """Broadcast presence status change to all clients."""
        presence_message = {
            "type": "presence",
            "client_id": client_id,
            "status": "online" if is_online else "offline",
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(presence_message, exclude=client_id)

    def get_active_users(self) -> List[str]:
        """Get the list of currently active users."""
        return list(self.active_connections.keys())

    def get_typing_users(self) -> List[str]:
        """Get the list of currently typing users."""
        return list(self.typing_users)

    def get_failed_message_count(self, client_id: str) -> int:
        """Get the count of failed messages for a client."""
        return len(self.failed_messages.get(client_id, []))

    async def record_failed_message(self, client_id: str, message: dict):
        if client_id not in self.failed_messages:
            self.failed_messages[client_id] = []
        self.failed_messages[client_id].append(Message(**message))

    async def add_reaction(self, message_id: int, user_id: str, reaction: str):
        """Add a reaction to a message and broadcast it."""
        stored_reaction = await self.storage.add_reaction(message_id, user_id, reaction)
        await self.broadcast({
            'type': 'reaction',
            'message_id': message_id,
            'user_id': user_id,
            'reaction': reaction,
            'timestamp': stored_reaction.timestamp.isoformat()
        })

    async def remove_reaction(self, message_id: int, user_id: str, reaction: str):
        """Remove a reaction from a message and broadcast it."""
        removed = await self.storage.remove_reaction(message_id, user_id, reaction)
        if removed:
            await self.broadcast({
                'type': 'remove_reaction',
                'message_id': message_id,
                'user_id': user_id,
                'reaction': reaction
            })

    async def close(self):
        """Close all connections and cleanup."""
        for connection in self.active_connections.values():
            await connection.close()
        self.storage.close()

    async def broadcast_to_thread(self, message: dict, thread_id: int, exclude: Optional[str] = None):
        """Broadcast a message to all clients in a thread."""
        # Save message to storage first
        if message.get('type') == 'message':
            stored_message = await self.storage.create_thread(thread_id, message)
            message['id'] = stored_message.id
        
        # Broadcast to all connected clients
        for client_id, connection in self.active_connections.items():
            if client_id != exclude:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to {client_id}: {str(e)}")
                    if message.get('type') == 'message':
                        self.failed_messages[client_id].append(Message(**message))
    
    async def get_thread_replies(self, thread_id: int) -> List[dict]:
        """Get all replies in a thread."""
        return await self.storage.get_thread_replies(thread_id) 