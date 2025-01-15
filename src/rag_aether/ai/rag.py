from langchain_anthropic import ChatAnthropic
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from typing import List, Optional, Dict, Any
import os
import json
from dotenv import load_dotenv
from src.rag_aether.data.firebase_adapter import FirebaseAdapter

load_dotenv()

class RAGSystem:
    def __init__(self, model_name: str = "claude-3-opus-20240229"):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.llm = ChatAnthropic(
            model_name=model_name,
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.vector_store = None
        self.qa_chain = None
        self.firebase = FirebaseAdapter()
        
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
            search_kwargs={"k": 3}
        )
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.retriever,
            return_source_documents=True
        )

    async def initialize_from_firebase(self) -> None:
        """Initialize the system with conversations from Firebase."""
        documents = await self.firebase.get_conversations()
        self.initialize_from_documents(documents)
        
        # Set up real-time updates
        def on_conversation_update(doc: Document):
            self.ingest_text(doc.page_content, doc.metadata)
            
        self.conversation_listener = await self.firebase.watch_conversations(on_conversation_update)

    def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Ingest new text into the vector store."""
        if self.vector_store is None:
            raise ValueError("Vector store not initialized. Call initialize_from_documents first.")
            
        # Split text into chunks
        chunks = self.text_splitter.split_text(text)
        documents = [Document(page_content=chunk, metadata=metadata) for chunk in chunks]
        
        # Add to existing vector store
        self.vector_store.add_documents(documents)

    async def query(self, question: str) -> Dict[str, Any]:
        """Query the RAG system."""
        if self.qa_chain is None:
            raise ValueError("QA chain not initialized. Call initialize_from_documents first.")
            
        result = await self.qa_chain.ainvoke({"query": question})
        
        return {
            "answer": result["result"],
            "sources": [doc.metadata for doc in result["source_documents"]]
        } 