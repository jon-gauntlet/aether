"""Tests for the storage module."""
import pytest
from datetime import datetime
from src.websocket.storage import Storage, Message, Reaction

@pytest.fixture
async def storage():
    """Create a test storage instance."""
    storage = Storage("sqlite+aiosqlite:///:memory:")
    await storage.create_tables()
    return storage

@pytest.mark.asyncio
async def test_save_message(storage):
    """Test saving a message."""
    message = await storage.save_message("Hello, world!", "user123")
    assert message.id is not None
    assert message.content == "Hello, world!"
    assert message.user_id == "user123"
    assert isinstance(message.timestamp, datetime)
    assert message.parent_id is None

@pytest.mark.asyncio
async def test_save_thread_message(storage):
    """Test saving a message in a thread."""
    # Create parent message
    parent = await storage.save_message("Parent message", "user1")
    
    # Create reply
    reply = await storage.save_message("Reply message", "user2", parent.id)
    assert reply.id is not None
    assert reply.content == "Reply message"
    assert reply.user_id == "user2"
    assert reply.parent_id == parent.id

    # Verify parent has the reply
    parent = await storage.get_message(parent.id)
    assert len(parent.replies) == 1
    assert parent.replies[0].id == reply.id

@pytest.mark.asyncio
async def test_get_message(storage):
    """Test retrieving a message."""
    saved = await storage.save_message("Test message", "user123")
    retrieved = await storage.get_message(saved.id)
    assert retrieved is not None
    assert retrieved.id == saved.id
    assert retrieved.content == "Test message"
    assert retrieved.user_id == "user123"

@pytest.mark.asyncio
async def test_get_thread_messages(storage):
    """Test retrieving messages in a thread."""
    # Create parent message
    parent = await storage.save_message("Parent message", "user1")
    
    # Create some replies
    replies = []
    for i in range(3):
        reply = await storage.save_message(f"Reply {i}", f"user{i}", parent.id)
        replies.append(reply)
    
    # Get thread messages
    thread_messages = await storage.get_thread_messages(parent.id)
    assert len(thread_messages) == 3
    assert thread_messages[0].content == "Reply 2"  # Most recent first
    assert thread_messages[1].content == "Reply 1"
    assert thread_messages[2].content == "Reply 0"

@pytest.mark.asyncio
async def test_get_recent_messages(storage):
    """Test retrieving recent messages."""
    # Create some test messages
    messages = []
    for i in range(5):
        msg = await storage.save_message(f"Message {i}", f"user{i}")
        messages.append(msg)

        # Add some replies
        if i % 2 == 0:  # Add replies to even-numbered messages
            await storage.save_message(f"Reply to {i}", f"user{i+1}", msg.id)

    # Get recent messages
    recent = await storage.get_recent_messages(limit=3)
    assert len(recent) == 3
    assert recent[0].content == "Message 4"  # Most recent first
    assert recent[1].content == "Message 3"
    assert recent[2].content == "Message 2"
    
    # Verify reply counts
    assert len(recent[0].replies) == 0  # Message 4 (no replies)
    assert len(recent[1].replies) == 0  # Message 3 (no replies)
    assert len(recent[2].replies) == 1  # Message 2 (has reply)

@pytest.mark.asyncio
async def test_add_reaction(storage):
    """Test adding a reaction to a message."""
    # Create a message
    message = await storage.save_message("React to me!", "user1")

    # Add reaction
    reaction = await storage.add_reaction(message.id, "user2", "👍")
    assert reaction is not None
    assert reaction.message_id == message.id
    assert reaction.user_id == "user2"
    assert reaction.emoji == "👍"

    # Try to add the same reaction again
    duplicate = await storage.add_reaction(message.id, "user2", "👍")
    assert duplicate.id == reaction.id  # Should return existing reaction

@pytest.mark.asyncio
async def test_remove_reaction(storage):
    """Test removing a reaction from a message."""
    # Create message and reaction
    message = await storage.save_message("React to me!", "user1")
    await storage.add_reaction(message.id, "user2", "👍")

    # Remove reaction
    removed = await storage.remove_reaction(message.id, "user2", "👍")
    assert removed is True

@pytest.mark.asyncio
async def test_remove_nonexistent_reaction(storage):
    """Test removing a nonexistent reaction."""
    message = await storage.save_message("No reactions", "user1")
    removed = await storage.remove_reaction(message.id, "user2", "👍")
    assert removed is False 