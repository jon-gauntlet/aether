from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class ChatMessage:
    """Represents a chat message in the system."""
    content: str
    role: str = "user"  # user, assistant, system
    metadata: Optional[Dict[str, Any]] = None
    timestamp: Optional[float] = None
    message_id: Optional[str] = None
    thread_id: Optional[str] = None
    channel_id: Optional[str] = None
    user_id: Optional[str] = None 