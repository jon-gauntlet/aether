"""Document representation for RAG system."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime

@dataclass
class Document:
    """Represents a document in the RAG system."""
    id: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None
    chunks: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert document to dictionary."""
        return {
            'id': self.id,
            'content': self.content,
            'metadata': self.metadata,
            'embedding': self.embedding,
            'chunks': self.chunks,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Document':
        """Create Document instance from dictionary."""
        return cls(
            id=data['id'],
            content=data['content'],
            metadata=data.get('metadata', {}),
            embedding=data.get('embedding'),
            chunks=data.get('chunks', []),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at'])
        ) 