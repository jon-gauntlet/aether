from typing import Dict, Set, Optional, List
import asyncio
import logging
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel

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

    async def connect(self, websocket: WebSocket, client_id: str):
        """Connect a new client and set up their message queue."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.user_presence[client_id] = datetime.utcnow()
        self.failed_messages[client_id] = []
        
        # Start message retry task
        asyncio.create_task(self._process_failed_messages(client_id))
        
        # Broadcast presence
        await self.broadcast_presence(client_id, True)

    async def disconnect(self, client_id: str):
        """Handle client disconnection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.user_presence:
            del self.user_presence[client_id]
        if client_id in self.typing_users:
            self.typing_users.remove(client_id)
        if client_id in self.failed_messages:
            del self.failed_messages[client_id]
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

    async def broadcast(self, message: str, exclude: Optional[str] = None):
        """Broadcast a message to all connected clients except the excluded one."""
        for client_id, connection in self.active_connections.items():
            if client_id != exclude:
                await connection.send_text(message)

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
        await self.broadcast(str(status_message), exclude=client_id)

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
        await self.broadcast(str(receipt_message))

    async def broadcast_presence(self, client_id: str, is_online: bool):
        """Broadcast presence status change to all clients."""
        presence_message = {
            "type": "presence",
            "client_id": client_id,
            "status": "online" if is_online else "offline",
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(str(presence_message), exclude=client_id)

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