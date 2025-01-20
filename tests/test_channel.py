import pytest
from datetime import datetime
from websocket.channel import Channel, ChannelConfig, ChannelManager

class MockWebSocket:
    def __init__(self):
        self.sent_messages = []
        self.closed = False

    async def send_json(self, message):
        self.sent_messages.append(message)

    def close(self):
        self.closed = True

@pytest.fixture
def channel_config():
    return ChannelConfig(
        name="test-channel",
        max_connections=2,
        message_rate_limit=5,
        require_auth=True,
        permissions={
            "user1": {"connect", "send_message"},
            "user2": {"connect"}
        }
    )

@pytest.fixture
def channel(channel_config):
    return Channel(channel_config.name, channel_config)

@pytest.fixture
def channel_manager():
    return ChannelManager()

@pytest.mark.asyncio
async def test_channel_add_connection(channel):
    websocket = MockWebSocket()
    
    # Test successful connection
    success = await channel.add_connection("client1", "user1", websocket)
    assert success
    assert len(channel.connections) == 1
    assert channel.get_active_users() == {"user1"}

    # Test connection with insufficient permissions
    success = await channel.add_connection("client2", "user3", websocket)
    assert not success
    assert len(channel.connections) == 1

    # Test connection limit
    websocket2 = MockWebSocket()
    await channel.add_connection("client2", "user2", websocket2)
    websocket3 = MockWebSocket()
    success = await channel.add_connection("client3", "user1", websocket3)
    assert not success
    assert len(channel.connections) == 2

@pytest.mark.asyncio
async def test_channel_remove_connection(channel):
    websocket = MockWebSocket()
    await channel.add_connection("client1", "user1", websocket)
    
    assert len(channel.connections) == 1
    await channel.remove_connection("client1")
    assert len(channel.connections) == 0
    assert len(channel.get_active_users()) == 0

@pytest.mark.asyncio
async def test_channel_broadcast(channel):
    websocket1 = MockWebSocket()
    websocket2 = MockWebSocket()
    await channel.add_connection("client1", "user1", websocket1)
    await channel.add_connection("client2", "user2", websocket2)

    message = {"type": "test", "content": "Hello"}
    await channel.broadcast(message)

    assert len(websocket1.sent_messages) == 1
    assert len(websocket2.sent_messages) == 1
    assert websocket1.sent_messages[0] == message
    assert websocket2.sent_messages[0] == message

@pytest.mark.asyncio
async def test_channel_broadcast_with_exclude(channel):
    websocket1 = MockWebSocket()
    websocket2 = MockWebSocket()
    await channel.add_connection("client1", "user1", websocket1)
    await channel.add_connection("client2", "user2", websocket2)

    message = {"type": "test", "content": "Hello"}
    await channel.broadcast(message, exclude="client1")

    assert len(websocket1.sent_messages) == 0
    assert len(websocket2.sent_messages) == 1
    assert websocket2.sent_messages[0] == message

def test_channel_rate_limiting(channel):
    # Test user with send_message permission
    assert channel.can_send_message("user1")
    for _ in range(5):
        channel.increment_message_count("user1")
    assert not channel.can_send_message("user1")

    # Test user without send_message permission
    assert not channel.can_send_message("user2")

def test_channel_typing_status(channel):
    channel.update_typing("user1", True)
    assert "user1" in channel.get_typing_users()

    channel.update_typing("user1", False)
    assert "user1" not in channel.get_typing_users()

def test_channel_manager_create_channel(channel_manager):
    config = ChannelConfig(name="test-channel")
    channel = channel_manager.create_channel(config)
    
    assert channel.name == "test-channel"
    assert channel_manager.get_channel("test-channel") == channel

    # Test duplicate channel creation
    with pytest.raises(ValueError):
        channel_manager.create_channel(config)

def test_channel_manager_delete_channel(channel_manager):
    config = ChannelConfig(name="test-channel")
    channel_manager.create_channel(config)
    
    assert channel_manager.get_channel("test-channel") is not None
    channel_manager.delete_channel("test-channel")
    assert channel_manager.get_channel("test-channel") is None

@pytest.mark.asyncio
async def test_channel_manager_broadcast_system_message(channel_manager):
    # Create two channels with connections
    channel1_config = ChannelConfig(name="channel1")
    channel2_config = ChannelConfig(name="channel2")
    
    channel1 = channel_manager.create_channel(channel1_config)
    channel2 = channel_manager.create_channel(channel2_config)

    websocket1 = MockWebSocket()
    websocket2 = MockWebSocket()
    
    await channel1.add_connection("client1", "user1", websocket1)
    await channel2.add_connection("client2", "user2", websocket2)

    message = {"type": "announcement", "content": "System maintenance"}
    await channel_manager.broadcast_system_message(message)

    # Check that both channels received the system message
    assert len(websocket1.sent_messages) == 1
    assert len(websocket2.sent_messages) == 1
    assert websocket1.sent_messages[0]["type"] == "system"
    assert websocket2.sent_messages[0]["type"] == "system"
    assert websocket1.sent_messages[0]["content"] == message
    assert websocket2.sent_messages[0]["content"] == message

def test_channel_manager_metrics(channel_manager):
    # Create channels with different states
    channel1_config = ChannelConfig(name="channel1")
    channel2_config = ChannelConfig(name="channel2")
    
    channel1 = channel_manager.create_channel(channel1_config)
    channel2 = channel_manager.create_channel(channel2_config)

    # Add some state to the channels
    channel1.user_ids = {"client1": "user1", "client2": "user2"}
    channel2.user_ids = {"client3": "user3"}
    channel1.typing_users = {"user1"}

    metrics = channel_manager.get_channel_metrics()
    
    assert "channel1" in metrics
    assert "channel2" in metrics
    assert metrics["channel1"]["active_users"] == 2
    assert metrics["channel1"]["typing_users"] == 1
    assert metrics["channel2"]["active_users"] == 1
    assert metrics["channel2"]["typing_users"] == 0 