"""Tests for WebSocket storage."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.websocket.storage import Storage

@pytest.fixture
async def storage():
    """Create a test storage instance."""
    storage = Storage("sqlite+aiosqlite:///:memory:")
    await storage.create_tables()
    return storage

@pytest.mark.asyncio
async def test_save_message(storage: Storage):
    """Test saving a message."""
    async with storage.async_session() as session:
        async with session.begin():
            message = await storage.save_message(session, "Test message", "user1")
            assert message.content == "Test message"
            assert message.user_id == "user1"
            assert message.parent_id is None

@pytest.mark.asyncio
async def test_save_thread_message(storage: Storage):
    """Test saving a message in a thread."""
    async with storage.async_session() as session:
        async with session.begin():
            # Create parent message
            parent = await storage.save_message(session, "Parent message", "user1")
            assert parent.content == "Parent message"
            assert parent.parent_id is None

            # Create reply
            reply = await storage.save_message(session, "Reply message", "user2", parent.id)
            assert reply.content == "Reply message"
            assert reply.parent_id == parent.id

@pytest.mark.asyncio
async def test_get_message(storage: Storage):
    """Test retrieving a message by ID."""
    async with storage.async_session() as session:
        async with session.begin():
            # Create message
            message = await storage.save_message(session, "Test message", "user1")
            
            # Retrieve message
            retrieved = await storage.get_message(session, message.id)
            assert retrieved.content == "Test message"
            assert retrieved.user_id == "user1"

@pytest.mark.asyncio
async def test_get_thread_messages(storage: Storage):
    """Test retrieving messages in a thread."""
    async with storage.async_session() as session:
        async with session.begin():
            # Create parent message
            parent = await storage.save_message(session, "Parent message", "user1")
            
            # Create replies
            replies = []
            for i in range(3):
                reply = await storage.save_message(
                    session,
                    f"Reply {i}",
                    "user2",
                    parent.id
                )
                replies.append(reply)
            
            # Get thread messages
            thread_messages = await storage.get_thread_messages(session, parent.id)
            assert len(thread_messages) == 3
            assert thread_messages[0].content == "Reply 2"  # Most recent first
            assert thread_messages[1].content == "Reply 1"
            assert thread_messages[2].content == "Reply 0"

@pytest.mark.asyncio
async def test_get_recent_messages(storage: Storage):
    """Test retrieving recent messages."""
    async with storage.async_session() as session:
        async with session.begin():
            # Create messages
            messages = []
            for i in range(5):
                message = await storage.save_message(
                    session,
                    f"Message {i}",
                    "user1"
                )
                messages.append(message)
                
                # Add a reply to even-numbered messages
                if i % 2 == 0:
                    await storage.save_message(
                        session,
                        f"Reply to {i}",
                        "user2",
                        message.id
                    )
            
            # Get recent messages
            recent = await storage.get_recent_messages(session, limit=3)
            assert len(recent) == 3
            assert recent[0].content == "Message 4"  # Most recent first
            assert recent[1].content == "Message 3"
            assert recent[2].content == "Message 2"
            
            # Check reply counts
            assert recent[0].reply_count == 0  # Message 4 has no replies
            assert recent[1].reply_count == 0  # Message 3 has no replies
            assert recent[2].reply_count == 1  # Message 2 has one reply

@pytest.mark.asyncio
async def test_add_reaction(storage: Storage):
    """Test adding a reaction to a message."""
    async with storage.async_session() as session:
        async with session.begin():
            # Create message
            message = await storage.save_message(session, "Test message", "user1")
            
            # Add reaction
            added = await storage.add_reaction(session, message.id, "user2", "👍")
            assert added is True
            
            # Try to add same reaction again
            added = await storage.add_reaction(session, message.id, "user2", "👍")
            assert added is False
            
            # Get message to check reaction
            message = await storage.get_message(session, message.id)
            assert len(message.reactions) == 1
            assert message.reactions[0].emoji == "👍"
            assert message.reactions[0].user_id == "user2"

@pytest.mark.asyncio
async def test_remove_reaction(storage: Storage):
    """Test removing a reaction from a message."""
    async with storage.async_session() as session:
        async with session.begin():
            # Create message
            message = await storage.save_message(session, "Test message", "user1")
            
            # Add reaction
            await storage.add_reaction(session, message.id, "user2", "👍")
            
            # Remove reaction
            removed = await storage.remove_reaction(session, message.id, "user2", "👍")
            assert removed is True
            
            # Try to remove non-existent reaction
            removed = await storage.remove_reaction(session, message.id, "user2", "👍")
            assert removed is False
            
            # Get message to check reaction was removed
            message = await storage.get_message(session, message.id)
            assert len(message.reactions) == 0 