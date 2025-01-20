from typing import Dict
from datetime import datetime, timedelta
from pydantic import BaseModel

class RateLimitConfig(BaseModel):
    """Configuration for rate limiting."""
    max_connections_per_user: int = 5
    max_messages_per_minute: int = 60
    max_typing_updates_per_minute: int = 10
    burst_limit: int = 10
    burst_time_window: int = 10  # seconds

class RateLimiter:
    def __init__(self, config: RateLimitConfig = None):
        self.config = config or RateLimitConfig()
        self.user_connections: Dict[str, int] = {}
        self.message_counts: Dict[str, list] = {}
        self.typing_updates: Dict[str, list] = {}

    async def can_connect(self, user_id: str) -> bool:
        """Check if a user can create a new connection."""
        return self.user_connections.get(user_id, 0) < self.config.max_connections_per_user

    async def add_connection(self, user_id: str):
        """Record a new connection for a user."""
        self.user_connections[user_id] = self.user_connections.get(user_id, 0) + 1

    async def remove_connection(self, user_id: str):
        """Remove a connection for a user."""
        if user_id in self.user_connections:
            self.user_connections[user_id] = max(0, self.user_connections[user_id] - 1)

    async def can_send_message(self, user_id: str) -> bool:
        """Check if a user can send a new message."""
        now = datetime.utcnow()
        if user_id not in self.message_counts:
            self.message_counts[user_id] = []
        
        # Clean old timestamps
        self.message_counts[user_id] = [
            ts for ts in self.message_counts[user_id]
            if now - ts < timedelta(minutes=1)
        ]
        
        # Check burst limit
        recent_messages = len([
            ts for ts in self.message_counts[user_id]
            if now - ts < timedelta(seconds=self.config.burst_time_window)
        ])
        if recent_messages >= self.config.burst_limit:
            return False
        
        # Check rate limit
        return len(self.message_counts[user_id]) < self.config.max_messages_per_minute

    async def record_message(self, user_id: str):
        """Record a message sent by a user."""
        if user_id not in self.message_counts:
            self.message_counts[user_id] = []
        self.message_counts[user_id].append(datetime.utcnow())

    async def can_send_typing_update(self, user_id: str) -> bool:
        """Check if a user can send a typing update."""
        now = datetime.utcnow()
        if user_id not in self.typing_updates:
            self.typing_updates[user_id] = []
        
        # Clean old timestamps
        self.typing_updates[user_id] = [
            ts for ts in self.typing_updates[user_id]
            if now - ts < timedelta(minutes=1)
        ]
        
        return len(self.typing_updates[user_id]) < self.config.max_typing_updates_per_minute

    async def record_typing_update(self, user_id: str):
        """Record a typing update from a user."""
        if user_id not in self.typing_updates:
            self.typing_updates[user_id] = []
        self.typing_updates[user_id].append(datetime.utcnow())

    def get_user_metrics(self, user_id: str) -> dict:
        """Get rate limiting metrics for a user."""
        now = datetime.utcnow()
        return {
            "connections": self.user_connections.get(user_id, 0),
            "messages": {
                "total": len(self.message_counts.get(user_id, [])),
                "last_minute": len([
                    ts for ts in self.message_counts.get(user_id, [])
                    if now - ts < timedelta(minutes=1)
                ])
            },
            "typing_updates": {
                "total": len(self.typing_updates.get(user_id, [])),
                "last_minute": len([
                    ts for ts in self.typing_updates.get(user_id, [])
                    if now - ts < timedelta(minutes=1)
                ])
            }
        } 