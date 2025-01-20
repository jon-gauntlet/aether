from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
from datetime import datetime

from .models.message import Message
from .services.messages import MessageService
from .websocket import websocket_router

app = FastAPI()
message_service = MessageService()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket router
app.include_router(websocket_router, prefix="/api")

@app.get("/api/messages/{channel}")
async def get_messages(channel: str):
    """Get all messages for a channel."""
    messages = await message_service.get_messages(channel)
    return {"messages": messages}

@app.get("/api/status")
async def get_status():
    """Get overall application status."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }
