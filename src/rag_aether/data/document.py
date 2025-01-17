"""Document processing and chunking implementation."""
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
import re

@dataclass
class Chunk:
    """A chunk of text with metadata."""
    content: str
    start_idx: int
    end_idx: int
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Document:
    """Document with content and metadata."""
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    chunks: List[Chunk] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        """Process document after initialization."""
        self.metadata.update({
            'length': len(self.content),
            'created_at': self.created_at.isoformat(),
            'chunk_count': 0
        })
        self._chunk_content()
    
    def _chunk_content(self, chunk_size: int = 1000, overlap: int = 100):
        """Chunk content intelligently based on semantic boundaries."""
        # Split into paragraphs first
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', self.content) if p.strip()]
        
        current_chunk = []
        current_size = 0
        start_idx = 0
        
        for para in paragraphs:
            para_size = len(para)
            
            # If adding this paragraph exceeds chunk size, create new chunk
            if current_size + para_size > chunk_size and current_chunk:
                chunk_text = ' '.join(current_chunk)
                self.chunks.append(Chunk(
                    content=chunk_text,
                    start_idx=start_idx,
                    end_idx=start_idx + len(chunk_text),
                    metadata={
                        'index': len(self.chunks),
                        'parent_doc': self.metadata.get('filename', 'unknown'),
                        'length': len(chunk_text)
                    }
                ))
                
                # Handle overlap
                overlap_size = 0
                while overlap_size < overlap and current_chunk:
                    overlap_size += len(current_chunk[-1])
                    if overlap_size <= overlap:
                        current_chunk.pop(0)
                    
                current_size = sum(len(c) for c in current_chunk)
                start_idx = start_idx + len(chunk_text) - overlap_size
            
            current_chunk.append(para)
            current_size += para_size
        
        # Handle remaining text
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            self.chunks.append(Chunk(
                content=chunk_text,
                start_idx=start_idx,
                end_idx=start_idx + len(chunk_text),
                metadata={
                    'index': len(self.chunks),
                    'parent_doc': self.metadata.get('filename', 'unknown'),
                    'length': len(chunk_text)
                }
            ))
        
        self.metadata['chunk_count'] = len(self.chunks) 