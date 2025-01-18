"""FastAPI server setup."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Dict, Any

from ..ai.rag_system import RAGSystem
from .routes import router
from .websocket import manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(title="RAG Aether API")
    
    # Configure CORS with WebSocket support
    origins = [
        # HTTP origins for development
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        # WebSocket origins for development
        "ws://localhost:8000",
        "ws://127.0.0.1:8000",
        # Allow WebSocket connections from frontend to backend
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )
    
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all incoming requests."""
        logger.info(f"Request: {request.method} {request.url}")
        logger.info(f"Headers: {dict(request.headers)}")
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    
    # Include router
    app.include_router(router)
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "name": "RAG API",
            "version": "1.0.0",
            "status": "running",
            "docs_url": "/docs"
        }

    async def verify_client(headers: Dict[str, Any], client_host: str) -> bool:
        """Verify WebSocket client connection."""
        origin = headers.get('origin', '')
        if not origin:
            logger.error(f"No origin header from {client_host}")
            return False
            
        # Allow both http:// and ws:// origins
        origin_http = origin
        origin_ws = origin.replace('http://', 'ws://')
        allowed_origins = origins + [o.replace('http://', 'ws://') for o in origins]
        
        if origin_http not in allowed_origins and origin_ws not in allowed_origins:
            logger.error(f"Invalid origin {origin} from {client_host}")
            return False
            
        return True

    @app.websocket("/ws/{channel}")
    async def websocket_endpoint(websocket: WebSocket, channel: str):
        """WebSocket endpoint for real-time chat."""
        client = f"{websocket.client.host}:{websocket.client.port}"
        logger.info(f"WebSocket connection attempt from {client} for channel {channel}")
        logger.info(f"Headers: {dict(websocket.headers)}")
        
        try:
            # Verify client before accepting connection
            if not await verify_client(dict(websocket.headers), client):
                logger.error(f"Client verification failed for {client}")
                await websocket.close(code=1008)  # Policy Violation
                return
                
            # Let the manager handle the connection acceptance
            await manager.connect(websocket, channel)
            logger.info(f"Client {client} added to channel {channel}")
            
            try:
                while True:
                    message = await websocket.receive_json()
                    logger.info(f"Received message from {client} in channel {channel}: {message}")
                    await manager.broadcast_to_channel(message, channel)
                    logger.info(f"Broadcasted message to channel {channel}")
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for {client}")
                manager.disconnect(websocket, channel)
            except Exception as e:
                logger.error(f"Error in WebSocket message handling: {str(e)}", exc_info=True)
                manager.disconnect(websocket, channel)
                
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {str(e)}", exc_info=True)
            try:
                manager.disconnect(websocket, channel)
                await websocket.close(code=1011)  # Internal Error
            except:
                pass
    
    return app 