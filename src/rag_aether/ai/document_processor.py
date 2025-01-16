"""Document processing module for RAG system."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import numpy as np
from transformers import AutoTokenizer
from rag_aether.core.errors import DocumentProcessingError
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import performance_section

logger = get_logger(__name__)

@dataclass
class DocumentChunk:
    """Represents a chunk of a document."""
    text: str
    metadata: Dict[str, Any]
    chunk_id: str
    embedding: Optional[np.ndarray] = None

class DocumentProcessor:
    """Handles document processing and chunking."""
    
    def __init__(
        self,
        tokenizer_name: str = "bert-base-uncased",
        max_chunk_size: int = 512,
        overlap: int = 50
    ):
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
        
    async def process_document(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """Process a document into chunks."""
        try:
            with performance_section("document_processing"):
                # Tokenize document
                tokens = self.tokenizer.encode(
                    text,
                    add_special_tokens=False,
                    truncation=False
                )
                
                # Create chunks
                chunks = []
                start = 0
                chunk_number = 0
                
                while start < len(tokens):
                    # Calculate end position
                    end = min(start + self.max_chunk_size, len(tokens))
                    
                    # Decode chunk
                    chunk_tokens = tokens[start:end]
                    chunk_text = self.tokenizer.decode(
                        chunk_tokens,
                        skip_special_tokens=True
                    )
                    
                    # Create chunk with metadata
                    chunk_metadata = {
                        "chunk_number": chunk_number,
                        "total_chunks": -1,  # Will update after all chunks created
                        "start_pos": start,
                        "end_pos": end,
                        **(metadata or {})
                    }
                    
                    chunk_id = f"{metadata.get('doc_id', 'doc')}_{chunk_number}"
                    
                    chunks.append(DocumentChunk(
                        text=chunk_text,
                        metadata=chunk_metadata,
                        chunk_id=chunk_id
                    ))
                    
                    # Move to next chunk with overlap
                    start = end - self.overlap
                    chunk_number += 1
                
                # Update total chunks in metadata
                for chunk in chunks:
                    chunk.metadata["total_chunks"] = len(chunks)
                
                logger.debug(
                    "Processed document into %d chunks",
                    len(chunks)
                )
                
                return chunks
                
        except Exception as e:
            raise DocumentProcessingError(
                f"Failed to process document: {str(e)}"
            ) from e
            
    def _clean_text(self, text: str) -> str:
        """Clean text before processing."""
        # Remove excessive whitespace
        text = " ".join(text.split())
        
        # Remove control characters
        text = "".join(char for char in text if char.isprintable())
        
        return text
        
    def _is_valid_chunk(
        self,
        chunk_text: str,
        min_chars: int = 50
    ) -> bool:
        """Check if a chunk is valid for processing."""
        if len(chunk_text) < min_chars:
            return False
            
        # Check if chunk has actual content
        content_ratio = len([c for c in chunk_text if c.isalnum()]) / len(chunk_text)
        if content_ratio < 0.3:
            return False
            
        return True 