from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional, Any

@dataclass
class ChatMessage:
    """Represents a chat message with metadata."""
    
    id: str
    content: str
    author: str
    timestamp: datetime
    channel_id: str
    thread_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ChatMessage":
        """Create a ChatMessage instance from a dictionary."""
        return cls(
            id=data["id"],
            content=data["content"],
            author=data["author"],
            timestamp=datetime.fromisoformat(data["timestamp"]) if isinstance(data["timestamp"], str) else data["timestamp"],
            channel_id=data["channel_id"],
            thread_id=data.get("thread_id"),
            metadata=data.get("metadata", {})
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the message to a dictionary."""
        return {
            "id": self.id,
            "content": self.content,
            "author": self.author,
            "timestamp": self.timestamp.isoformat(),
            "channel_id": self.channel_id,
            "thread_id": self.thread_id,
            "metadata": self.metadata or {}
        } 