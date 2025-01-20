"""FastAPI WebSocket application."""
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .manager import ConnectionManager
from .storage import Storage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="WebSocket Chat")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize storage and manager
storage = Storage()
manager = ConnectionManager(storage)

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup."""
    await storage.create_tables()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    # Disconnect all active WebSocket connections
    for user_id in list(manager.active_connections.keys()):
        await manager.disconnect(user_id)
    await storage.close()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Handle WebSocket connections."""
    try:
        await manager.connect(websocket, user_id)
        logger.info(f"Client connected: {user_id}")

        try:
            while True:
                # Receive message
                data = await websocket.receive_json()
                logger.debug(f"Received message from {user_id}: {data}")

                # Handle different message types
                message_type = data.get("type", "message")

                if message_type == "message":
                    await manager.handle_message(
                        user_id,
                        data["content"],
                        data.get("parent_id")  # Optional thread parent
                    )

                elif message_type == "get_thread":
                    thread = await manager.get_thread(data["message_id"])
                    if thread:
                        await websocket.send_json({
                            "type": "thread",
                            "message_id": data["message_id"],
                            **thread
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Thread not found"
                        })

                elif message_type == "reaction":
                    await manager.handle_reaction(
                        user_id,
                        data["message_id"],
                        data["emoji"]
                    )

                elif message_type == "remove_reaction":
                    await manager.remove_reaction(
                        user_id,
                        data["message_id"],
                        data["emoji"]
                    )

                elif message_type == "typing":
                    await manager.set_typing(user_id, data["is_typing"])

                else:
                    logger.warning(f"Unknown message type: {message_type}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Unknown message type"
                    })

        except WebSocketDisconnect:
            logger.info(f"Client disconnected: {user_id}")
            await manager.disconnect(user_id)

        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await websocket.send_json({
                "type": "error",
                "message": "Internal server error"
            })
            await websocket.close(code=1011)  # Internal error

    except Exception as e:
        logger.error(f"Error connecting client: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 