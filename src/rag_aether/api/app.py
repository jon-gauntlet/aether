"""FastAPI application for RAG API."""
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ..ai.vector_store import VectorStore
from ..ai.ml_client import MLClient
from ..ai.integration_system import IntegrationSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aether RAG API",
    description="API for retrieval-augmented generation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configured in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check response model
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    components: Dict[str, str]

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        # Check vector store
        vector_store = VectorStore()
        await vector_store.similarity_search("test", k=1)
        vector_store_status = "healthy"
    except Exception as e:
        logger.warning(f"Vector store health check failed: {e}")
        vector_store_status = "degraded"

    try:
        # Check ML client
        ml_client = MLClient()
        await ml_client.create_embedding("test")
        ml_client_status = "healthy"
    except Exception as e:
        logger.warning(f"ML client health check failed: {e}")
        ml_client_status = "degraded"

    # Overall status is healthy only if all components are healthy
    overall_status = "healthy" if all(
        status == "healthy" for status in [vector_store_status, ml_client_status]
    ) else "degraded"

    return HealthResponse(
        status=overall_status,
        version="1.0.0",
        components={
            "vector_store": vector_store_status,
            "ml_client": ml_client_status
        }
    )

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.integration_system = IntegrationSystem()

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_user(self, message: Dict[str, Any], user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def process_message(self, data: Dict[str, Any], user_id: str):
        try:
            # Send typing indicator
            await self.broadcast_to_user(
                {"type": "typing", "data": {"status": True}},
                user_id
            )

            # Process message through integration system
            result = await self.integration_system.process_message(
                user_id=user_id,
                message=data["content"],
                conversation_history=data.get("conversation_history", []),
                metadata_filter=data.get("metadata_filter"),
                max_tokens=data.get("max_tokens")
            )

            # Send response
            await self.broadcast_to_user(
                {
                    "type": "message",
                    "data": {
                        "response": result["response"],
                        "is_user_available": result["is_user_available"],
                        "relevant_documents": result["relevant_documents"],
                        "conversation_id": data.get("conversation_id")
                    }
                },
                user_id
            )

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self.broadcast_to_user(
                {
                    "type": "error",
                    "data": {"detail": str(e)}
                },
                user_id
            )
        finally:
            # Clear typing indicator
            await self.broadcast_to_user(
                {"type": "typing", "data": {"status": False}},
                user_id
            )

manager = ConnectionManager()

# Dependency injection
async def get_vector_store():
    """Get vector store client."""
    return VectorStore()

async def get_ml_client():
    """Get ML client."""
    return MLClient()

async def get_integration_system():
    """Get integration system."""
    return IntegrationSystem()

class Document(BaseModel):
    """Document for ingestion."""
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SearchQuery(BaseModel):
    """Search query with parameters."""
    query: str
    k: int = 4
    threshold: float = 0.8
    metadata_filter: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    """Chat message."""
    role: str
    content: str

class ChatRequest(BaseModel):
    """Chat request with context."""
    messages: List[ChatMessage]
    max_tokens: Optional[int] = None
    temperature: float = 0.7

@app.post("/documents", response_model=List[str])
async def add_documents(
    documents: List[Document],
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[str]:
    """Add documents to the vector store.
    
    Args:
        documents: List of documents to add
        vector_store: Vector store client
        
    Returns:
        List of document IDs
    """
    try:
        texts = [doc.text for doc in documents]
        metadata = [doc.metadata for doc in documents]
        return await vector_store.add_texts(texts, metadata)
    except Exception as e:
        logger.error(f"Failed to add documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(
    query: SearchQuery,
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[Dict[str, Any]]:
    """Search for similar documents.
    
    Args:
        query: Search parameters
        vector_store: Vector store client
        
    Returns:
        List of matching documents with similarity scores
    """
    try:
        return await vector_store.similarity_search(
            query=query.query,
            k=query.k,
            threshold=query.threshold,
            metadata_filter=query.metadata_filter
        )
    except Exception as e:
        logger.error(f"Failed to search documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(
    request: ChatRequest,
    ml_client: MLClient = Depends(get_ml_client)
) -> Dict[str, str]:
    """Get a chat completion.
    
    Args:
        request: Chat request parameters
        ml_client: ML client
        
    Returns:
        Generated response text
    """
    try:
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        response = await ml_client.get_completion(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Failed to get chat completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, str]:
    """Delete a document from the vector store.
    
    Args:
        doc_id: Document ID to delete
        vector_store: Vector store client
        
    Returns:
        Success message
    """
    try:
        await vector_store.delete_texts([doc_id])
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat."""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.process_message(data, user_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

@app.post("/persona/analyze")
async def analyze_user_style(
    user_id: str,
    messages: List[Dict[str, str]],
    integration: IntegrationSystem = Depends(get_integration_system)
) -> Dict[str, Any]:
    """Analyze user's communication style."""
    try:
        return await integration.analyze_user_messages(user_id, messages)
    except Exception as e:
        logger.error(f"Failed to analyze user style: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/persona/availability")
async def update_availability(
    user_id: str,
    active_hours: Dict[str, List[int]],
    integration: IntegrationSystem = Depends(get_integration_system)
) -> Dict[str, bool]:
    """Update user's active hours."""
    try:
        success = await integration.update_user_availability(user_id, active_hours)
        return {"success": success}
    except Exception as e:
        logger.error(f"Failed to update availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/integrate/message")
async def process_message(
    user_id: str,
    message: str,
    conversation_history: List[Dict[str, Any]],
    metadata_filter: Optional[Dict[str, Any]] = None,
    max_tokens: Optional[int] = None,
    integration: IntegrationSystem = Depends(get_integration_system)
) -> Dict[str, Any]:
    """Process a message using the integration system."""
    try:
        return await integration.process_message(
            user_id=user_id,
            message=message,
            conversation_history=conversation_history,
            metadata_filter=metadata_filter,
            max_tokens=max_tokens
        )
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 