"""Test fixtures for WebSocket tests."""
import pytest
from src.websocket.storage import Storage
from src.websocket.manager import ConnectionManager

class MockWebSocket:
    """Mock WebSocket for testing."""
    def __init__(self):
        self.accepted = False
        self.sent_messages = []
        self.closed = False
        self.close_code = None

    async def accept(self):
        """Accept the connection."""
        self.accepted = True

    async def send_json(self, message):
        """Send a JSON message."""
        self.sent_messages.append(message)

    async def close(self, code=1000):
        """Close the connection."""
        self.closed = True
        self.close_code = code

@pytest.fixture
async def storage():
    """Create a test storage instance."""
    storage = Storage("sqlite+aiosqlite:///:memory:")
    await storage.create_tables()
    yield storage
    await storage.close()

@pytest.fixture
async def manager(storage):
    """Create a test connection manager instance."""
    return ConnectionManager(storage) 