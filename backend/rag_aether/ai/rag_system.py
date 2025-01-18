"""RAG system implementation."""
import torch
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

class BaseRAG:
    """Base RAG system with core functionality."""
    
    def __init__(self, model_name="BAAI/bge-small-en"):
        """Initialize the RAG system."""
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = SentenceTransformer(model_name).to(self.device)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
    def encode_texts(self, texts):
        """Encode texts into embeddings."""
        return self.model.encode(
            texts,
            convert_to_tensor=True,
            device=self.device
        )

class RAGSystem(BaseRAG):
    """Enhanced RAG system with additional features."""
    
    def __init__(self, model_name="BAAI/bge-small-en", mock_model=None):
        """Initialize the RAG system."""
        super().__init__(model_name)
        self.documents = []
        self.document_embeddings = None
        self.index = None
        self._mock_model = mock_model  # For testing
        
    def add_documents(self, documents):
        """Add documents to the system."""
        self.documents.extend(documents)
        texts = [doc["text"] for doc in documents]
        
        # Get embeddings
        if self._mock_model:
            embeddings = self._mock_model.encode(texts)
        else:
            embeddings = self.encode_texts(texts)
            
        # Initialize or update document embeddings
        if self.document_embeddings is None:
            self.document_embeddings = embeddings
        else:
            self.document_embeddings = torch.cat([self.document_embeddings, embeddings])
            
        # Update FAISS index
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.embedding_dim)
        self.index.add(embeddings.cpu().numpy())
        
    async def search(self, query, k=5):
        """Search for relevant documents."""
        if not self.documents:
            return []
            
        # Get query embedding
        if self._mock_model:
            query_embedding = self._mock_model.encode([query])[0]
        else:
            query_embedding = self.encode_texts([query])[0]
            
        # Search index
        D, I = self.index.search(
            query_embedding.cpu().numpy().reshape(1, -1),
            min(k, len(self.documents))
        )
        
        # Format results
        results = []
        for score, idx in zip(D[0], I[0]):
            results.append({
                "score": float(-score),  # Convert distance to similarity score
                "document": self.documents[idx]
            })
            
        return sorted(results, key=lambda x: x["score"], reverse=True) 