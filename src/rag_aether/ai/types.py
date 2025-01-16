"""Common types for the RAG system."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime

@dataclass
class ChatMessage:
    """Represents a chat message in the RAG system."""
    role: str  # 'user', 'assistant', or 'system'
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary."""
        return {
            'role': self.role,
            'content': self.content,
            'metadata': self.metadata,
            'timestamp': self.timestamp.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ChatMessage':
        """Create ChatMessage instance from dictionary."""
        return cls(
            role=data['role'],
            content=data['content'],
            metadata=data.get('metadata', {}),
            timestamp=datetime.fromisoformat(data['timestamp'])
        )

@dataclass
class QueryContext:
    """Context for a query in the RAG system."""
    query: str
    chat_history: List[ChatMessage] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class SearchQuery:
    """Search query with parameters."""
    text: str
    filters: Dict[str, Any] = field(default_factory=dict)
    top_k: int = 5
    min_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict) 