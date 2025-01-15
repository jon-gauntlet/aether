from langchain_anthropic import ChatAnthropic
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List, Optional, Dict, Any
import os
import json
from dotenv import load_dotenv
from src.rag_aether.data.mock.conversations import get_mock_conversations

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
        mock_conversations = get_mock_conversations()
        
        # Convert conversations to documents
        documents = []
        for conv in mock_conversations:
            # Add conversation context as a document
            context_doc = Document(
                page_content=f"Conversation: {conv['title']}\nContext: {json.dumps(conv['context'], indent=2)}",
                metadata={
                    'conversation_id': conv['id'],
                    'title': conv['title'],
                    'type': 'conversation_context',
                    'created_at': conv['created_at']
                }
            )
            documents.append(context_doc)
            
            # Add each message as a document
            for msg in conv['messages']:
                doc = Document(
                    page_content=msg['content'],
                    metadata={
                        'message_id': msg['id'],
                        'conversation_id': conv['id'],
                        'title': conv['title'],
                        'sender': msg['sender'],
                        'timestamp': msg['timestamp'],
                        'type': 'message',
                        **msg.get('metadata', {})
                    }
                )
                documents.append(doc)
        
        self.initialize_from_documents(documents)

    def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest text into the RAG system."""
        try:
            documents = [Document(page_content=text, metadata=metadata or {})]
            chunks = self.text_splitter.split_documents(documents)
            
            if self.vector_store is None:
                self.vector_store = FAISS.from_documents(chunks, self.embeddings)
            else:
                self.vector_store.add_documents(chunks)
            
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_store.as_retriever()
            )
            
            return len(chunks)
        except Exception as e:
            print(f"Error ingesting text: {str(e)}")
            raise

    def query(self, question: str) -> str:
        """Query the RAG system."""
        if self.qa_chain is None:
            raise ValueError("No documents have been ingested yet")
        
        try:
            response = self.qa_chain.invoke({"query": question})
            return response["result"]
        except Exception as e:
            print(f"Error querying RAG system: {str(e)}")
            raise 