from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from anthropic import Anthropic
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory document store for demo
documents: Dict[str, Dict[str, Any]] = {}

class Query(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    context: List[str]

def redact_api_key(key):
    if not key:
        return "None"
    return f"{key[:10]}...{key[-5:]}"

@router.post("/query")
async def query_rag(query: Query):
    try:
        if not query.question:
            raise HTTPException(status_code=400, detail="Question cannot be empty")
            
        # Get API key from environment
        api_key = os.getenv("ANTHROPIC_API_KEY")
        logger.info(f"API Key: {redact_api_key(api_key)}")
        
        if not api_key:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
            
        client = Anthropic(api_key=api_key)
        
        # Get context from stored documents
        context = "\n\n".join([doc.get("content", "") for doc in documents.values()])
        
        # Create system prompt with context
        system_prompt = f"""You are a helpful AI assistant with access to information about the Aether project.
Use the following context to answer questions accurately:

{context}

Only use information from the provided context. If you don't have enough information in the context, say so."""
        
        # Get response from Claude
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            temperature=0,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": query.question
                }
            ]
        )
        
        return QueryResponse(
            answer=message.content[0].text,
            context=[doc.get("content", "") for doc in documents.values()]
        )
    except Exception as e:
        logger.error(f"Error in query_rag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 