from typing import List, Optional, Dict
import numpy as np
from sentence_transformers import SentenceTransformer
from app.models.document import Document
import uuid

class DocumentStore:
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def add_document(self, content: str, title: Optional[str] = None, metadata: Optional[dict] = None) -> Document:
        # Generate document ID
        doc_id = str(uuid.uuid4())
        
        # Create embedding
        embedding = self.embeddings_model.encode(content).tolist()
        
        # Create document
        document = Document(
            id=doc_id,
            content=content,
            title=title,
            metadata=metadata or {},
            embedding=embedding
        )
        
        # Store document
        self.documents[doc_id] = document
        return document
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        return self.documents.get(doc_id)
    
    def get_all_documents(self) -> List[Document]:
        return list(self.documents.values())
    
    def search_documents(self, query: str, top_k: int = 5) -> List[Document]:
        if not self.documents:
            return []
        
        # Generate query embedding
        query_embedding = self.embeddings_model.encode(query)
        
        # Calculate similarities
        similarities = []
        for doc in self.documents.values():
            if doc.embedding:
                similarity = np.dot(query_embedding, doc.embedding)
                similarities.append((similarity, doc))
        
        # Sort by similarity and return top_k documents
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in similarities[:top_k]]

# Global instance
document_store = DocumentStore() 