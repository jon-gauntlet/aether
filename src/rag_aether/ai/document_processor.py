"""Document processing for RAG system."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import re
from datetime import datetime
import numpy as np

@dataclass
class Document:
    """Document with content and metadata."""
    content: str
    metadata: Dict[str, Any]

class DocumentProcessor:
    """Process and prepare documents for RAG system."""
    
    def __init__(
        self,
        max_chunk_size: int = 512,
        chunk_overlap: int = 128,
        min_chunk_size: int = 64,
        clean_text: bool = True,
        preserve_whitespace: bool = False
    ):
        """Initialize document processor.
        
        Args:
            max_chunk_size: Maximum chunk size in characters
            chunk_overlap: Number of characters to overlap between chunks
            min_chunk_size: Minimum chunk size in characters
            clean_text: Whether to clean text (remove extra whitespace etc)
            preserve_whitespace: Whether to preserve whitespace in output
        """
        self.max_chunk_size = max_chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.clean_text = clean_text
        self.preserve_whitespace = preserve_whitespace
        
    def process_document(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """Process a document into chunks with metadata.
        
        Args:
            content: Document content
            metadata: Optional metadata
            
        Returns:
            List of processed document chunks
        """
        # Clean text if requested
        if self.clean_text:
            content = self._clean_text(content)
            
        # Split into chunks
        chunks = self._split_into_chunks(content)
        
        # Create documents with metadata
        documents = []
        base_metadata = metadata or {}
        
        for i, chunk in enumerate(chunks):
            # Create chunk metadata
            chunk_metadata = {
                **base_metadata,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "timestamp": datetime.now().isoformat(),
            }
            
            # Create document
            doc = Document(
                content=chunk,
                metadata=chunk_metadata
            )
            documents.append(doc)
            
        return documents
        
    def process_documents(
        self,
        contents: List[str],
        metadata: Optional[List[Dict[str, Any]]] = None
    ) -> List[Document]:
        """Process multiple documents.
        
        Args:
            contents: List of document contents
            metadata: Optional list of metadata dicts
            
        Returns:
            List of processed documents
        """
        if metadata is None:
            metadata = [{}] * len(contents)
            
        if len(metadata) != len(contents):
            raise ValueError(
                f"Length mismatch: {len(contents)} contents vs {len(metadata)} metadata"
            )
            
        documents = []
        for content, meta in zip(contents, metadata):
            chunks = self.process_document(content, meta)
            documents.extend(chunks)
            
        return documents
        
    def _clean_text(self, text: str) -> str:
        """Clean text by removing extra whitespace etc."""
        if not self.preserve_whitespace:
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)
            # Remove leading/trailing whitespace
            text = text.strip()
            
        return text
        
    def _split_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        if len(text) <= self.max_chunk_size:
            return [text]
            
        chunks = []
        start = 0
        
        while start < len(text):
            # Find end of chunk
            end = start + self.max_chunk_size
            
            if end >= len(text):
                # Last chunk
                chunk = text[start:]
                if len(chunk) >= self.min_chunk_size:
                    chunks.append(chunk)
                elif chunks:
                    # Append to previous chunk if too small
                    chunks[-1] = chunks[-1] + chunk
                break
                
            # Try to break at sentence boundary
            sentence_end = self._find_sentence_boundary(
                text,
                start + self.min_chunk_size,
                end
            )
            
            if sentence_end > 0:
                end = sentence_end
                
            # Extract chunk
            chunk = text[start:end]
            if len(chunk) >= self.min_chunk_size:
                chunks.append(chunk)
                
            # Move start position
            start = end - self.chunk_overlap
            
        return chunks
        
    def _find_sentence_boundary(
        self,
        text: str,
        start: int,
        end: int
    ) -> int:
        """Find nearest sentence boundary between start and end."""
        # Common sentence endings
        boundaries = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
        
        # Find all boundary positions
        positions = []
        for boundary in boundaries:
            pos = text.rfind(boundary, start, end)
            if pos > 0:
                positions.append(pos + len(boundary) - 1)
                
        if not positions:
            return -1
            
        # Return latest boundary position
        return max(positions)
        
    def merge_documents(
        self,
        documents: List[Document],
        merge_metadata: bool = True
    ) -> Document:
        """Merge multiple documents into one.
        
        Args:
            documents: Documents to merge
            merge_metadata: Whether to merge metadata
            
        Returns:
            Merged document
        """
        if not documents:
            raise ValueError("No documents to merge")
            
        # Merge content
        content = "\n".join(doc.content for doc in documents)
        
        # Merge metadata if requested
        if merge_metadata:
            metadata = {}
            for doc in documents:
                metadata.update(doc.metadata)
        else:
            metadata = documents[0].metadata
            
        return Document(content=content, metadata=metadata)
        
    def filter_documents(
        self,
        documents: List[Document],
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """Filter documents based on criteria.
        
        Args:
            documents: Documents to filter
            min_length: Minimum content length
            max_length: Maximum content length
            metadata_filters: Metadata key-value pairs to match
            
        Returns:
            Filtered documents
        """
        filtered = []
        
        for doc in documents:
            # Check length constraints
            if min_length and len(doc.content) < min_length:
                continue
            if max_length and len(doc.content) > max_length:
                continue
                
            # Check metadata filters
            if metadata_filters:
                match = True
                for key, value in metadata_filters.items():
                    if key not in doc.metadata or doc.metadata[key] != value:
                        match = False
                        break
                if not match:
                    continue
                    
            filtered.append(doc)
            
        return filtered 