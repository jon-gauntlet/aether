"""Tests for the WebSocket application."""
import pytest
from fastapi.testclient import TestClient
from src.websocket.app import app, storage

@pytest.fixture
async def client():
    """Create a test client."""
    await storage.create_tables()  # Create tables before tests
    return TestClient(app)

@pytest.mark.asyncio
async def test_websocket_message(client):
    """Test sending a message."""
    with client.websocket_connect("/ws/test_user") as websocket:
        # Skip initial message history
        websocket.receive_json()

        # Send a message
        websocket.send_json({
            "type": "message",
            "content": "Hello, world!"
        })

        # Verify response
        response = websocket.receive_json()
        assert response["type"] == "message"
        assert response["content"] == "Hello, world!"
        assert response["user_id"] == "test_user"
        assert "id" in response
        assert "timestamp" in response

@pytest.mark.asyncio
async def test_websocket_thread(client):
    """Test thread functionality."""
    with client.websocket_connect("/ws/test_user") as websocket:
        # Skip initial message history
        websocket.receive_json()

        # Send parent message
        websocket.send_json({
            "type": "message",
            "content": "Parent message"
        })
        parent = websocket.receive_json()

        # Send reply
        websocket.send_json({
            "type": "message",
            "content": "Reply message",
            "parent_id": parent["id"]
        })
        reply = websocket.receive_json()

        # Get thread
        websocket.send_json({
            "type": "get_thread",
            "message_id": parent["id"]
        })
        thread = websocket.receive_json()

        assert thread["type"] == "thread"
        assert thread["message_id"] == parent["id"]
        assert thread["parent"]["content"] == "Parent message"
        assert len(thread["replies"]) == 1
        assert thread["replies"][0]["content"] == "Reply message"

@pytest.mark.asyncio
async def test_websocket_reaction(client):
    """Test message reactions."""
    with client.websocket_connect("/ws/test_user") as websocket:
        # Skip initial message history
        websocket.receive_json()

        # Send a message
        websocket.send_json({
            "type": "message",
            "content": "React to this!"
        })
        message = websocket.receive_json()

        # Add reaction
        websocket.send_json({
            "type": "reaction",
            "message_id": message["id"],
            "emoji": "👍"
        })
        reaction = websocket.receive_json()

        assert reaction["type"] == "reaction"
        assert reaction["message_id"] == message["id"]
        assert reaction["emoji"] == "👍"
        assert reaction["user_id"] == "test_user"

        # Remove reaction
        websocket.send_json({
            "type": "remove_reaction",
            "message_id": message["id"],
            "emoji": "👍"
        })
        removed = websocket.receive_json()

        assert removed["type"] == "remove_reaction"
        assert removed["message_id"] == message["id"]
        assert removed["emoji"] == "👍"
        assert removed["user_id"] == "test_user"

@pytest.mark.asyncio
async def test_websocket_typing(client):
    """Test typing status."""
    with client.websocket_connect("/ws/test_user") as websocket:
        # Skip initial message history
        websocket.receive_json()

        # Set typing status
        websocket.send_json({
            "type": "typing",
            "is_typing": True
        })
        typing = websocket.receive_json()

        assert typing["type"] == "typing"
        assert typing["user_id"] == "test_user"
        assert typing["is_typing"] is True

@pytest.mark.asyncio
async def test_websocket_disconnect(client):
    """Test client disconnection."""
    with client.websocket_connect("/ws/test_user") as websocket:
        # Skip initial message history
        websocket.receive_json()

    # Connection should be closed after context exit 