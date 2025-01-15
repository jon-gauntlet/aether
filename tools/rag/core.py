import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores.faiss import FAISS
from langchain.schema.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA

from .data_prep import create_langchain_documents

@dataclass
class SearchResult:
    """Search result with relevance score."""
    document: Document
    score: float
    
    def __post_init__(self):
        self.score = max(0.0, min(1.0, self.score))

class RAGSystem:
    """Core RAG system implementation."""
    
    def __init__(
        self,
        embedding_model: str = "text-embedding-3-large",
        llm_model: str = "gpt-3.5-turbo",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        self.embeddings = OpenAIEmbeddings(model=embedding_model)
        self.llm = ChatOpenAI(model=llm_model)
        self.vector_store = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        self.retriever = None
        self.qa_chain = None
    
    def initialize_from_documents(self, documents: List[Document]) -> None:
        """Initialize vector store from documents."""
        # Split documents into chunks
        splits = []
        for doc in documents:
            chunks = self.text_splitter.split_text(doc.page_content)
            for chunk in chunks:
                splits.append(Document(
                    page_content=chunk,
                    metadata=doc.metadata
                ))
        
        # Create vector store
        self.vector_store = FAISS.from_documents(splits, self.embeddings)
        
        # Initialize retriever and QA chain
        self.retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 4}
        )
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.retriever,
            return_source_documents=True
        )
    
    def initialize_from_mock_data(self) -> None:
        """Initialize system with mock data for testing."""
        documents = create_langchain_documents()
        self.initialize_from_documents(documents)
    
    async def search(
        self,
        query: str,
        k: int = 4,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """Perform semantic search over documents."""
        if not self.vector_store:
            raise ValueError("Vector store not initialized")
        
        # Basic similarity search
        raw_results = self.vector_store.similarity_search_with_score(
            query,
            k=k
        )
        
        # Convert to SearchResult objects
        results = []
        for doc, score in raw_results:
            # Skip if doesn't match filters
            if filter_metadata:
                if not all(
                    doc.metadata.get(key) == value 
                    for key, value in filter_metadata.items()
                ):
                    continue
            
            # Normalize score to 0-1
            norm_score = 1 - score/2  # FAISS returns euclidean distance
            
            results.append(SearchResult(
                document=doc,
                score=norm_score
            ))
        
        # Sort by score
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results[:k]
    
    async def query(
        self,
        question: str,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Answer questions using RAG."""
        if not self.qa_chain:
            raise ValueError("QA chain not initialized")
        
        # Add metadata filter if provided
        search_kwargs = {}
        if filter_metadata:
            search_kwargs["filter"] = filter_metadata
        
        # Get answer
        result = self.qa_chain(
            {"query": question},
            return_only_outputs=True
        )
        
        return {
            "answer": result["result"],
            "source_documents": result["source_documents"]
        } 