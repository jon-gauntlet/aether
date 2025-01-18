from typing import List
import os
import anthropic
from app.models.document import Document

class ClaudeService:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.Anthropic(api_key=api_key)
        
    def generate_response(self, query: str, context_docs: List[Document]) -> str:
        # Prepare context from relevant documents
        context = "\n\n".join([
            f"Document: {doc.title or 'Untitled'}\n{doc.content}"
            for doc in context_docs
        ])
        
        # Construct the prompt
        system_prompt = """You are a helpful AI assistant. Answer the question based on the provided context. 
        If you cannot find the answer in the context, say so. Do not make up information.
        Keep your responses focused and relevant to the query."""
        
        user_message = f"""Context:
        {context}
        
        Question: {query}
        
        Please provide a clear and concise answer based on the context above."""
        
        # Generate response using Claude
        message = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            temperature=0.7,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        
        return message.content[0].text
    
    async def generate_response_with_sources(self, query: str, context_docs: List[Document]) -> dict:
        """Generate a response and include the source documents used."""
        response = self.generate_response(query, context_docs)
        
        sources = [
            {
                "id": doc.id,
                "title": doc.title or "Untitled",
                "metadata": doc.metadata
            }
            for doc in context_docs
        ]
        
        return {
            "response": response,
            "sources": sources
        }

# Global instance
claude_service = ClaudeService() 