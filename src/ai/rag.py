from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class RAGSystem:
    def __init__(self, model_name: str = "gpt-3.5-turbo"):
        self.embeddings = OpenAIEmbeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.llm = ChatOpenAI(model_name=model_name, temperature=0)
        self.vector_store = None
        self.qa_chain = None

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