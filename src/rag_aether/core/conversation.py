"""Conversation management for RAG system."""
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

@dataclass
class Message:
    """A message in a conversation."""
    content: str
    role: str  # 'user' or 'assistant'
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

class ConversationManager:
    """Manages conversations and their histories."""
    
    def __init__(self, max_history: int = 10):
        """Initialize conversation manager.
        
        Args:
            max_history: Maximum number of messages to keep in history
        """
        self.conversations: Dict[str, List[Message]] = {}
        self.max_history = max_history
    
    def create_conversation(self) -> str:
        """Create a new conversation."""
        conv_id = str(uuid.uuid4())
        self.conversations[conv_id] = []
        return conv_id
    
    def add_message(
        self,
        conversation_id: str,
        content: str,
        role: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add a message to a conversation."""
        if conversation_id not in self.conversations:
            conversation_id = self.create_conversation()
            
        message = Message(
            content=content,
            role=role,
            metadata=metadata or {}
        )
        
        self.conversations[conversation_id].append(message)
        
        # Trim history if needed
        if len(self.conversations[conversation_id]) > self.max_history:
            self.conversations[conversation_id] = self.conversations[conversation_id][-self.max_history:]
    
    def get_history(
        self,
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get conversation history."""
        if conversation_id not in self.conversations:
            return []
            
        history = self.conversations[conversation_id]
        if limit:
            history = history[-limit:]
            
        return [
            {
                'content': msg.content,
                'role': msg.role,
                'timestamp': msg.timestamp.isoformat(),
                'metadata': msg.metadata
            }
            for msg in history
        ]
    
    def get_context_window(
        self,
        conversation_id: str,
        window_size: int = 3
    ) -> str:
        """Get concatenated recent messages as context window."""
        history = self.get_history(conversation_id, limit=window_size)
        return ' '.join(
            f"{msg['role']}: {msg['content']}"
            for msg in history
        ) 