"""Tests for the WebSocket connection manager."""
import pytest
import json
from datetime import datetime
from src.websocket.manager import ConnectionManager
from src.websocket.storage import Storage

class MockWebSocket:
    """Mock WebSocket for testing."""
    def __init__(self):
        self.sent_messages = []
        self.closed = False
        self.accepted = False

    async def accept(self):
        """Accept the connection."""
        self.accepted = True

    async def send_json(self, data):
        """Record sent JSON messages."""
        self.sent_messages.append(data)

    async def close(self):
        """Mark the connection as closed."""
        self.closed = True

@pytest.fixture
async def storage():
    """Create a test storage instance."""
    storage = Storage("sqlite+aiosqlite:///:memory:")
    await storage.create_tables()
    return storage

@pytest.fixture
async def manager(storage):
    """Create a test connection manager."""
    return ConnectionManager(storage)

@pytest.mark.asyncio
async def test_connect(manager):
    """Test client connection."""
    ws = MockWebSocket()
    user_id = "test_user"
    await manager.connect(ws, user_id)
    
    assert ws.accepted
    assert user_id in manager.active_connections
    assert user_id in manager.user_presence
    assert isinstance(manager.user_presence[user_id], datetime)

@pytest.mark.asyncio
async def test_disconnect(manager):
    """Test client disconnection."""
    ws = MockWebSocket()
    user_id = "test_user"
    
    await manager.connect(ws, user_id)
    await manager.disconnect(user_id)
    
    assert user_id not in manager.active_connections
    assert user_id not in manager.user_presence

@pytest.mark.asyncio
async def test_broadcast_message(manager):
    """Test broadcasting messages to connected clients."""
    # Connect two clients
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect(ws1, "user1")
    await manager.connect(ws2, "user2")
    
    # Broadcast a message
    message = {
        "type": "message",
        "content": "Hello, everyone!"
    }
    await manager.broadcast(message)
    
    # Verify both clients received the message
    assert len(ws1.sent_messages) == 2  # Initial history + broadcast
    assert len(ws2.sent_messages) == 2
    assert ws1.sent_messages[-1] == message
    assert ws2.sent_messages[-1] == message

@pytest.mark.asyncio
async def test_handle_message(manager):
    """Test handling and broadcasting a new message."""
    # Connect a client
    ws = MockWebSocket()
    user_id = "test_user"
    await manager.connect(ws, user_id)
    
    # Send a message
    content = "Test message"
    await manager.handle_message(user_id, content)
    
    # Verify the message was broadcast
    broadcast = ws.sent_messages[-1]
    assert broadcast["type"] == "message"
    assert broadcast["content"] == content
    assert broadcast["user_id"] == user_id
    assert broadcast["parent_id"] is None
    assert broadcast["reply_count"] == 0

@pytest.mark.asyncio
async def test_handle_thread_message(manager):
    """Test handling and broadcasting a thread message."""
    # Connect a client
    ws = MockWebSocket()
    user_id = "test_user"
    await manager.connect(ws, user_id)
    
    # Create parent message
    parent_content = "Parent message"
    await manager.handle_message(user_id, parent_content)
    parent_msg = ws.sent_messages[-1]
    
    # Send reply
    reply_content = "Reply message"
    await manager.handle_message(user_id, reply_content, parent_msg["id"])
    
    # Verify the reply was broadcast
    broadcast = ws.sent_messages[-1]
    assert broadcast["type"] == "message"
    assert broadcast["content"] == reply_content
    assert broadcast["user_id"] == user_id
    assert broadcast["parent_id"] == parent_msg["id"]
    assert broadcast["reply_count"] == 0

@pytest.mark.asyncio
async def test_get_thread(manager):
    """Test retrieving thread messages."""
    # Connect a client
    ws = MockWebSocket()
    user_id = "test_user"
    await manager.connect(ws, user_id)
    
    # Create parent message
    parent_content = "Parent message"
    await manager.handle_message(user_id, parent_content)
    parent_msg = ws.sent_messages[-1]
    
    # Add some replies
    reply_contents = ["Reply 1", "Reply 2", "Reply 3"]
    for content in reply_contents:
        await manager.handle_message(user_id, content, parent_msg["id"])
    
    # Get thread
    thread = await manager.get_thread(parent_msg["id"])
    
    # Verify thread structure
    assert thread["parent"]["content"] == parent_content
    assert thread["parent"]["user_id"] == user_id
    assert len(thread["replies"]) == 3
    assert thread["replies"][0]["content"] == "Reply 3"  # Most recent first
    assert thread["replies"][1]["content"] == "Reply 2"
    assert thread["replies"][2]["content"] == "Reply 1"

@pytest.mark.asyncio
async def test_handle_reaction(manager):
    """Test handling message reactions."""
    # Connect a client
    ws = MockWebSocket()
    user_id = "test_user"
    await manager.connect(ws, user_id)
    
    # Create a message to react to
    message = await manager.storage.save_message("React to me", user_id)
    
    # Add reaction
    await manager.handle_reaction(user_id, message.id, "👍")
    
    # Verify the reaction was broadcast
    broadcast = ws.sent_messages[-1]
    assert broadcast["type"] == "reaction"
    assert broadcast["message_id"] == message.id
    assert broadcast["user_id"] == user_id
    assert broadcast["emoji"] == "👍"

@pytest.mark.asyncio
async def test_remove_reaction(manager):
    """Test removing message reactions."""
    # Connect a client
    ws = MockWebSocket()
    user_id = "test_user"
    await manager.connect(ws, user_id)
    
    # Create a message and add a reaction
    message = await manager.storage.save_message("React to me", user_id)
    await manager.storage.add_reaction(message.id, user_id, "👍")
    
    # Remove reaction
    await manager.remove_reaction(user_id, message.id, "👍")
    
    # Verify the removal was broadcast
    broadcast = ws.sent_messages[-1]
    assert broadcast["type"] == "remove_reaction"
    assert broadcast["message_id"] == message.id
    assert broadcast["user_id"] == user_id
    assert broadcast["emoji"] == "👍"

@pytest.mark.asyncio
async def test_set_typing(manager):
    """Test typing status updates."""
    # Connect two clients
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect(ws1, "user1")
    await manager.connect(ws2, "user2")
    
    # Set typing status
    await manager.set_typing("user1", True)
    
    # Verify the status was broadcast to the other client
    broadcast = ws2.sent_messages[-1]
    assert broadcast["type"] == "typing"
    assert broadcast["user_id"] == "user1"
    assert broadcast["is_typing"] is True 