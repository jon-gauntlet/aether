import pytest
import asyncio
import json
from datetime import datetime, timedelta
import jwt
from fastapi import WebSocket, WebSocketDisconnect
from src.websocket.router import router, manager, rate_limiter, connection_pool, recovery_manager
from src.websocket.recovery import RecoveryConfig, SessionState
from src.core.auth import User, AuthService
from src.websocket.manager import ConnectionManager, Message
from src.websocket.rate_limiter import RateLimiter, RateLimitConfig
from src.websocket.pool import ConnectionPool, PoolConfig
from fastapi.testclient import TestClient
from ..src.websocket.manager import ConnectionManager, Message
from ..src.websocket.rate_limiter import RateLimiter, RateLimitConfig
from ..src.websocket.pool import ConnectionPool, PoolConfig
from ..src.core.auth import AuthService

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
def connection_manager():
    return ConnectionManager()

@pytest.fixture
def rate_limiter():
    config = RateLimitConfig(
        max_connections_per_user=2,
        max_messages_per_minute=5,
        max_typing_updates_per_minute=3,
        burst_limit=3
    )
    return RateLimiter(config)

@pytest.fixture
def connection_pool():
    config = PoolConfig(
        max_pool_size=10,
        max_channels=3,
        channel_buffer_size=5
    )
    return ConnectionPool(config)

@pytest.fixture
def auth_service():
    return AuthService()

@pytest.fixture
def test_user():
    return User(
        id="test-user-id",
        email="test@example.com",
        created_at=datetime.utcnow()
    )

@pytest.fixture
def test_token(test_user, auth_service):
    """Create a test JWT token."""
    payload = {
        "sub": test_user.id,
        "email": test_user.email,
        "exp": datetime.utcnow().timestamp() + 3600
    }
    return jwt.encode(payload, auth_service.jwt_secret, algorithm="HS256")

def test_websocket_status_endpoint(test_client):
    """Test the WebSocket status endpoint."""
    response = test_client.get("/api/ws/status")
    assert response.status_code == 200
    data = response.json()
    assert "active_users" in data
    assert "unique_users" in data
    assert "typing_users" in data
    assert "connection_health" in data
    assert isinstance(data["active_users"], int)
    assert isinstance(data["unique_users"], int)
    assert isinstance(data["typing_users"], int)
    assert isinstance(data["connection_health"], dict)
    assert "total_connections" in data["connection_health"]
    assert "pool_size" in data["connection_health"]
    assert "total_channels" in data["connection_health"]
    assert "active_channels" in data["connection_health"]

def test_websocket_metrics_endpoint(test_client):
    """Test the WebSocket metrics endpoint."""
    response = test_client.get("/api/ws/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "connections" in data
    assert "messages" in data
    assert "presence" in data
    assert "rate_limits" in data
    assert "timestamp" in data
    assert isinstance(data["connections"]["total"], int)
    assert isinstance(data["connections"]["unique_users"], int)
    assert isinstance(data["messages"]["failed"], int)
    assert isinstance(data["presence"]["online"], int)
    assert isinstance(data["rate_limits"], dict)

def test_active_users_endpoint(test_client):
    """Test the active users endpoint."""
    response = test_client.get("/api/ws/active-users")
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert isinstance(data["users"], list)

def test_typing_users_endpoint(test_client):
    """Test the typing users endpoint."""
    response = test_client.get("/api/ws/typing-users")
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert isinstance(data["users"], list)

def test_client_status_endpoint_not_found(test_client):
    """Test the client status endpoint with non-existent client."""
    response = test_client.get("/api/ws/client/nonexistent/status")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Client not found"

@pytest.mark.asyncio
async def test_rate_limiter_connection_limit(rate_limiter, test_user):
    """Test connection rate limiting."""
    user_id = test_user.id
    
    # First two connections should succeed
    assert await rate_limiter.can_connect(user_id)
    await rate_limiter.add_connection(user_id)
    
    assert await rate_limiter.can_connect(user_id)
    await rate_limiter.add_connection(user_id)
    
    # Third connection should fail
    assert not await rate_limiter.can_connect(user_id)
    
    # After removing a connection, should be able to connect again
    await rate_limiter.remove_connection(user_id)
    assert await rate_limiter.can_connect(user_id)

@pytest.mark.asyncio
async def test_rate_limiter_message_limit(rate_limiter, test_user):
    """Test message rate limiting."""
    user_id = test_user.id
    
    # Should be able to send up to burst limit quickly
    for _ in range(rate_limiter.config.burst_limit):
        assert await rate_limiter.can_send_message(user_id)
        await rate_limiter.record_message(user_id)
    
    # Next message should be rate limited
    assert not await rate_limiter.can_send_message(user_id)

@pytest.mark.asyncio
async def test_connection_pool_limits(connection_pool):
    """Test connection pool limits."""
    class MockWebSocket:
        async def accept(self):
            pass
        async def send_text(self, text):
            pass
        async def close(self, code=None, reason=None):
            pass
    
    # Should be able to add up to max_pool_size connections
    websockets = []
    for i in range(connection_pool.config.max_pool_size):
        ws = MockWebSocket()
        websockets.append(ws)
        assert await connection_pool.add_connection(ws, f"channel{i%3}")
    
    # Next connection should fail
    ws = MockWebSocket()
    assert not await connection_pool.add_connection(ws, "channel1")
    
    # After removing a connection, should be able to add again
    await connection_pool.remove_connection(websockets[0], "channel0")
    assert await connection_pool.add_connection(ws, "channel0")

@pytest.mark.asyncio
async def test_connection_pool_channel_limits(connection_pool):
    """Test connection pool channel limits."""
    class MockWebSocket:
        async def accept(self):
            pass
        async def send_text(self, text):
            pass
        async def close(self, code=None, reason=None):
            pass
    
    # Should be able to create up to max_channels
    for i in range(connection_pool.config.max_channels):
        ws = MockWebSocket()
        assert await connection_pool.add_connection(ws, f"channel{i}")
    
    # Next new channel should fail
    ws = MockWebSocket()
    assert not await connection_pool.add_connection(
        ws,
        f"channel{connection_pool.config.max_channels}"
    )
    
    # Should still be able to add to existing channel
    ws = MockWebSocket()
    assert await connection_pool.add_connection(ws, "channel0")

@pytest.mark.asyncio
async def test_connection_pool_message_buffer(connection_pool):
    """Test connection pool message buffering."""
    channel_name = "test_channel"
    messages = [
        {"id": i, "content": f"test{i}"}
        for i in range(connection_pool.config.channel_buffer_size + 2)
    ]
    
    # Add more messages than buffer size
    for msg in messages:
        await connection_pool.broadcast_to_channel(channel_name, msg)
    
    # Should only keep latest messages up to buffer size
    history = await connection_pool.get_channel_history(channel_name)
    assert len(history) == connection_pool.config.channel_buffer_size
    assert history[-1] == messages[-1]
    assert history[0] == messages[2]  # First two messages should be dropped

@pytest.mark.asyncio
async def test_connection_manager_connect_with_auth(
    connection_manager,
    rate_limiter,
    connection_pool,
    test_user,
    test_token
):
    """Test connecting a client with auth, rate limiting, and pooling."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            pass
            
        async def close(self, code=None, reason=None):
            pass
    
    websocket = MockWebSocket()
    client_id = "test_client"
    authenticated_client_id = f"{test_user.id}:{client_id}"
    channel_name = "test_channel"
    
    # Check rate limit
    assert await rate_limiter.can_connect(test_user.id)
    
    # Add to pool
    assert await connection_pool.add_connection(websocket, channel_name)
    
    # Connect
    await connection_manager.connect(websocket, authenticated_client_id)
    await rate_limiter.add_connection(test_user.id)
    
    # Verify connection
    assert authenticated_client_id in connection_manager.active_connections
    assert authenticated_client_id in connection_manager.message_queue
    assert authenticated_client_id in connection_manager.user_presence
    assert authenticated_client_id in connection_manager.failed_messages
    assert isinstance(connection_manager.failed_messages[authenticated_client_id], list)
    
    # Verify rate limiter state
    assert rate_limiter.user_connections[test_user.id] == 1
    
    # Verify pool state
    channel = connection_pool.channels[channel_name]
    assert websocket in channel.connections
    assert len(channel.connections) == 1

@pytest.mark.asyncio
async def test_connection_manager_disconnect_with_auth(
    connection_manager,
    test_user
):
    """Test disconnecting a client from the connection manager with authentication."""
    class MockWebSocket:
        async def accept(self):
            pass
        async def send_text(self, text):
            pass
    
    websocket = MockWebSocket()
    client_id = "test_client"
    authenticated_client_id = f"{test_user.id}:{client_id}"
    
    await connection_manager.connect(websocket, authenticated_client_id)
    await connection_manager.disconnect(authenticated_client_id)
    
    assert authenticated_client_id not in connection_manager.active_connections
    assert authenticated_client_id not in connection_manager.message_queue
    assert authenticated_client_id not in connection_manager.user_presence
    assert authenticated_client_id not in connection_manager.failed_messages

@pytest.mark.asyncio
async def test_connection_manager_message_retry_with_auth(
    connection_manager,
    test_user
):
    """Test message retry functionality with authentication."""
    class MockWebSocket:
        def __init__(self):
            self.fail_count = 2
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            if self.fail_count > 0:
                self.fail_count -= 1
                raise Exception("Simulated failure")
            self.sent_messages.append(text)
    
    websocket = MockWebSocket()
    client_id = "test_client"
    authenticated_client_id = f"{test_user.id}:{client_id}"
    
    await connection_manager.connect(websocket, authenticated_client_id)
    
    # Send a message that will fail initially
    message = "Test message"
    await connection_manager.send_personal_message(message, authenticated_client_id)
    
    # Check that the message was added to failed messages
    assert len(connection_manager.failed_messages[authenticated_client_id]) > 0
    
    # Verify failed message count
    assert connection_manager.get_failed_message_count(authenticated_client_id) > 0

@pytest.mark.asyncio
async def test_connection_manager_typing_status_with_auth(
    connection_manager,
    test_user
):
    """Test setting and getting typing status with authentication."""
    class MockWebSocket:
        async def accept(self):
            pass
        async def send_text(self, text):
            pass
    
    websocket = MockWebSocket()
    client_id = "test_client"
    authenticated_client_id = f"{test_user.id}:{client_id}"
    
    await connection_manager.connect(websocket, authenticated_client_id)
    await connection_manager.set_typing_status(authenticated_client_id, True)
    
    assert authenticated_client_id in connection_manager.typing_status
    assert connection_manager.typing_status[authenticated_client_id] is True
    assert authenticated_client_id in connection_manager.get_typing_users()

@pytest.mark.asyncio
async def test_connection_manager_read_receipt_with_auth(
    connection_manager,
    test_user
):
    """Test marking messages as read with authentication."""
    class MockWebSocket:
        async def accept(self):
            pass
        async def send_text(self, text):
            pass
    
    websocket = MockWebSocket()
    client_id = "test_client"
    authenticated_client_id = f"{test_user.id}:{client_id}"
    message_id = "test_message"
    
    await connection_manager.connect(websocket, authenticated_client_id)
    await connection_manager.mark_as_read(authenticated_client_id, message_id)
    
    assert message_id in connection_manager.read_receipts
    assert authenticated_client_id in connection_manager.read_receipts[message_id]

class MockWebSocket:
    def __init__(self, client_id: str):
        self.client_id = client_id
        self.received_messages = []
        self.closed = False
        self.close_code = None
        self.close_reason = None
        
    async def receive_text(self):
        return json.dumps({"type": "message", "content": "test"})
        
    async def send_text(self, message: str):
        self.received_messages.append(json.loads(message))
        
    async def send_json(self, message: dict):
        self.received_messages.append(message)
        
    async def close(self, code: int = 1000, reason: str = None):
        self.closed = True
        self.close_code = code
        self.close_reason = reason

@pytest.fixture
def mock_user():
    return User(id="test_user", email="test@example.com")

@pytest.fixture
def mock_websocket():
    return MockWebSocket("test_client")

@pytest.fixture
def rate_limiter_config():
    return RateLimitConfig(
        max_connections_per_user=2,
        max_messages_per_minute=5,
        max_typing_updates_per_minute=3,
        burst_limit=3
    )

@pytest.fixture
def pool_config():
    return PoolConfig(
        max_connections=10,
        max_connections_per_channel=3,
        max_channels=3,
        message_buffer_size=5
    )

@pytest.fixture
def recovery_config():
    return RecoveryConfig(
        session_timeout=5,
        max_missed_heartbeats=2,
        heartbeat_interval=1,
        recovery_buffer_size=10,
        max_recovery_attempts=2
    )

@pytest.mark.asyncio
async def test_websocket_connection(mock_websocket, mock_user):
    """Test basic WebSocket connection and disconnection."""
    # Connect
    await manager.connect(mock_websocket, "test_user:test_client")
    assert "test_user:test_client" in manager.get_active_users()
    
    # Disconnect
    await manager.disconnect("test_user:test_client")
    assert "test_user:test_client" not in manager.get_active_users()

@pytest.mark.asyncio
async def test_rate_limiting(mock_websocket, mock_user):
    """Test rate limiting functionality."""
    user_id = "test_user"
    
    # Test connection rate limiting
    assert await rate_limiter.can_connect(user_id) == True
    await rate_limiter.add_connection(user_id)
    
    # Test message rate limiting
    assert await rate_limiter.can_send_message(user_id) == True
    await rate_limiter.record_message(user_id)
    
    # Test typing update rate limiting
    assert await rate_limiter.can_send_typing_update(user_id) == True
    await rate_limiter.record_typing_update(user_id)
    
    # Get metrics
    metrics = rate_limiter.get_user_metrics(user_id)
    assert "connections" in metrics
    assert "messages" in metrics
    assert "typing_updates" in metrics

@pytest.mark.asyncio
async def test_connection_pool(mock_websocket):
    """Test connection pool functionality."""
    channel = "test_channel"
    
    # Add connection
    success = await connection_pool.add_connection(mock_websocket, channel)
    assert success == True
    
    # Test broadcasting
    test_message = {"type": "message", "content": "test"}
    await connection_pool.broadcast_to_channel(channel, test_message)
    
    # Remove connection
    await connection_pool.remove_connection(mock_websocket, channel)
    
    # Check metrics
    metrics = connection_pool.get_metrics()
    assert "total_connections" in metrics
    assert "total_channels" in metrics
    assert "channels" in metrics

@pytest.mark.asyncio
async def test_recovery_system(mock_websocket, recovery_config):
    """Test session recovery functionality."""
    client_id = "test_user:test_client"
    
    # Register session
    session = await recovery_manager.register_session(
        client_id,
        "test_user",
        "test_channel"
    )
    assert session.client_id == client_id
    
    # Update heartbeat
    await recovery_manager.update_heartbeat(client_id)
    assert client_id in recovery_manager.sessions
    
    # Record message
    test_message = {"type": "message", "content": "test"}
    await recovery_manager.record_message(client_id, test_message)
    
    # Test recovery eligibility
    can_recover = await recovery_manager.can_recover(client_id)
    assert can_recover == True
    
    # Get missed messages
    missed_messages = await recovery_manager.get_missed_messages(client_id, 0)
    assert len(missed_messages) > 0
    
    # Recover session
    recovered_session = await recovery_manager.recover_session(client_id, 0)
    assert recovered_session is not None
    assert recovered_session.client_id == client_id

@pytest.mark.asyncio
async def test_presence_detection(mock_websocket):
    """Test presence detection and typing indicators."""
    client_id = "test_user:test_client"
    
    # Connect and check presence
    await manager.connect(mock_websocket, client_id)
    assert client_id in manager.get_active_users()
    
    # Set typing status
    await manager.set_typing_status(client_id, True)
    assert client_id in manager.get_typing_users()
    
    # Clear typing status
    await manager.set_typing_status(client_id, False)
    assert client_id not in manager.get_typing_users()
    
    # Disconnect and verify removal
    await manager.disconnect(client_id)
    assert client_id not in manager.get_active_users()
    assert client_id not in manager.get_typing_users()

@pytest.mark.asyncio
async def test_metrics_endpoints(mock_websocket):
    """Test WebSocket metrics endpoints."""
    client_id = "test_user:test_client"
    await manager.connect(mock_websocket, client_id)
    
    # Test status endpoint
    status = await router.get_websocket_status()
    assert "active_users" in status
    assert "unique_users" in status
    assert "typing_users" in status
    assert "connection_health" in status
    
    # Test metrics endpoint
    metrics = await router.get_websocket_metrics()
    assert "connections" in metrics
    assert "rate_limits" in metrics
    assert "messages" in metrics
    assert "presence" in metrics
    assert "recovery" in metrics
    
    # Test client status endpoint
    client_status = await router.get_client_status("test_client")
    assert client_status["client_id"] == "test_client"
    assert "connected" in client_status
    assert "rate_limits" in client_status
    assert "channel" in client_status
    assert "session" in client_status

@pytest.mark.asyncio
async def test_error_handling(mock_websocket):
    """Test error handling and recovery mechanisms."""
    client_id = "test_user:test_client"
    
    # Test invalid message format
    invalid_message = "invalid json"
    await mock_websocket.receive_text()  # Should trigger error handling
    
    assert any(
        msg.get("type") == "error" 
        for msg in mock_websocket.received_messages
    )
    
    # Test rate limit exceeded
    await rate_limiter.record_message("test_user")
    for _ in range(rate_limiter.config.max_messages_per_minute):
        await rate_limiter.record_message("test_user")
    
    assert await rate_limiter.can_send_message("test_user") == False
    
    # Test connection pool limits
    for _ in range(connection_pool.config.max_connections_per_channel + 1):
        success = await connection_pool.add_connection(
            MockWebSocket(f"client_{_}"),
            "test_channel"
        )
        if _ >= connection_pool.config.max_connections_per_channel:
            assert success == False

@pytest.mark.asyncio
async def test_message_retry_system(mock_websocket):
    """Test message retry system and failed message handling."""
    client_id = "test_user:test_client"
    
    # Connect and send failed message
    await manager.connect(mock_websocket, client_id)
    failed_message = {
        "type": "message",
        "content": "failed message",
        "id": "msg_1"
    }
    
    # Record failed message
    await manager.record_failed_message(client_id, failed_message)
    assert manager.get_failed_message_count(client_id) > 0
    
    # Test retry request
    retry_request = {
        "type": "retry",
        "message_id": "msg_1"
    }
    await mock_websocket.receive_text()  # Simulate retry request
    
    # Verify retry handling
    assert any(
        msg.get("type") == "retry_status" 
        for msg in mock_websocket.received_messages
    )

@pytest.mark.asyncio
async def test_channel_management(mock_websocket):
    """Test channel management and message broadcasting."""
    channel = "test_channel"
    client_id = "test_user:test_client"
    
    # Add to channel
    await connection_pool.add_connection(mock_websocket, channel)
    
    # Broadcast message
    test_message = {
        "type": "message",
        "content": "channel test",
        "channel": channel
    }
    await connection_pool.broadcast_to_channel(channel, test_message)
    
    # Verify message received
    assert any(
        msg.get("content") == "channel test" 
        for msg in mock_websocket.received_messages
    )
    
    # Test channel metrics
    metrics = connection_pool.get_metrics()
    assert channel in metrics["channels"]
    assert metrics["channels"][channel]["connections"] > 0 