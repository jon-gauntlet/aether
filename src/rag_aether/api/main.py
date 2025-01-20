"""RAG Aether API."""
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, List, Optional
import os
import logging

from ..ai.rag_system import RAGSystem
from ..ai.errors import QueryProcessingError, DocumentProcessingError
from ..core.monitoring import monitor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG Aether API",
    description="API for retrieval-augmented generation with efficient batch processing",
    version="1.0.0"
)

# Global RAG system instance
rag_system: Optional[RAGSystem] = None

class Document(BaseModel):
    """Document model for ingestion."""
    text: str = Field(..., description="Text content to ingest")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")
    
    @field_validator("text")
    def content_must_not_be_empty(cls, v):
        """Validate document content."""
        if not v.strip():
            raise ValueError("Content must not be empty")
        return v

class Query(BaseModel):
    """Query model."""
    question: str = Field(..., description="Question to ask")
    max_results: Optional[int] = Field(3, description="Maximum number of results to return")
    min_score: Optional[float] = Field(0.7, description="Minimum similarity score threshold")

    @field_validator("question")
    def question_must_not_be_empty(cls, v):
        """Validate query question."""
        if not v.strip():
            raise ValueError("Question must not be empty")
        return v

class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Overall system status: healthy, degraded, or error")
    rag_system_ready: bool = Field(..., description="Whether the RAG system is initialized")
    message: str = Field(..., description="Detailed status message")
    version: str = Field(..., description="API version")
    metrics: Dict[str, Any] = Field(..., description="System metrics")
    components: Dict[str, str] = Field(..., description="Status of individual components")

class QueryResponse(BaseModel):
    """Query response model."""
    answer: str = Field(..., description="Generated answer")
    context: List[Dict[str, Any]] = Field(..., description="Retrieved context snippets")
    metrics: Dict[str, Any] = Field(..., description="Query performance metrics")

class IngestResponse(BaseModel):
    """Ingest response model."""
    status: str = Field(..., description="Success or failure status")
    metrics: Dict[str, Any] = Field(..., description="Ingestion performance metrics")
    document_id: Optional[str] = Field(None, description="ID of ingested document")

def get_rag_system() -> RAGSystem:
    """Get or initialize RAG system."""
    global rag_system
    if rag_system is None:
        if not os.getenv("OPENAI_API_KEY") and not os.getenv("USE_MOCK", "false").lower() == "true":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="RAG system not initialized: Missing OpenAI API key"
            )
        use_mock = os.getenv("USE_MOCK", "false").lower() == "true"
        try:
            rag_system = RAGSystem(use_mock=use_mock)
            logger.info("RAG system initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to initialize RAG system: {str(e)}"
            )
    return rag_system

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        system = get_rag_system()
        metrics = monitor.get_metrics()
        return HealthResponse(
            status="healthy",
            rag_system_ready=True,
            message="RAG system initialized and ready",
            version="1.0.0",
            metrics=metrics,
            components={
                "vector_store": metrics.get("vector_store_status", "unknown"),
                "ml_client": metrics.get("ml_client_status", "unknown"),
                "monitoring": metrics.get("monitoring_status", "unknown")
            }
        )
    except HTTPException as e:
        return HealthResponse(
            status="degraded",
            rag_system_ready=False,
            message=str(e.detail),
            version="1.0.0",
            metrics=monitor.get_metrics(),
            components={"rag_system": "unavailable"}
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="error",
            rag_system_ready=False,
            message=f"Internal server error: {str(e)}",
            version="1.0.0",
            metrics=monitor.get_metrics(),
            components={"rag_system": "error"}
        )

@app.post("/query", response_model=QueryResponse)
async def query(query: Query):
    """Query endpoint."""
    try:
        system = get_rag_system()
        result = await system.query(
            question=query.question,
            max_results=query.max_results,
            min_score=query.min_score
        )
        return QueryResponse(
            answer=result["answer"],
            context=result["context"],
            metrics=monitor.get_metrics()
        )
    except QueryProcessingError as e:
        logger.warning(f"Query processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": str(e), "metrics": monitor.get_metrics()}
        )
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "metrics": monitor.get_metrics()}
        )

@app.post("/ingest", response_model=IngestResponse)
async def ingest(document: Document):
    """Document ingestion endpoint."""
    try:
        system = get_rag_system()
        success = await system.ingest_text(
            text=document.text,
            metadata=document.metadata
        )
        return IngestResponse(
            status="success" if success else "failed",
            metrics=monitor.get_metrics(),
            document_id=success if isinstance(success, str) else None
        )
    except DocumentProcessingError as e:
        logger.warning(f"Document processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": str(e), "metrics": monitor.get_metrics()}
        )
    except Exception as e:
        logger.error(f"Ingestion error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "metrics": monitor.get_metrics()}
        ) 