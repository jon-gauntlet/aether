"""Document chunk module for RAG system."""

from dataclasses import dataclass
from typing import Dict, Any, Optional
from datetime import datetime

@dataclass
class DocumentChunk:
    """Document chunk class for storing text content and metadata."""
    
    content: str
    metadata: Dict[str, Any]
    chunk_id: str
    source_id: str
    timestamp: datetime = datetime.now()
    embedding: Optional[list] = None
    score: Optional[float] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DocumentChunk":
        """Create a DocumentChunk from a dictionary."""
        return cls(
            content=data["content"],
            metadata=data.get("metadata", {}),
            chunk_id=data["chunk_id"],
            source_id=data["source_id"],
            timestamp=data.get("timestamp", datetime.now()),
            embedding=data.get("embedding"),
            score=data.get("score")
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert DocumentChunk to a dictionary."""
        return {
            "content": self.content,
            "metadata": self.metadata,
            "chunk_id": self.chunk_id,
            "source_id": self.source_id,
            "timestamp": self.timestamp,
            "embedding": self.embedding,
            "score": self.score
        } 