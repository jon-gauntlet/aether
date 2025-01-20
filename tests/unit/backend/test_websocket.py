import pytest
import asyncio
import json
from datetime import datetime, timedelta
import jwt
from fastapi import WebSocket, WebSocketDisconnect
from websocket.router import router, manager, rate_limiter, connection_pool, recovery_manager
from websocket.recovery import RecoveryConfig, SessionState
from core.auth import User, AuthService
from websocket.manager import ConnectionManager, Message
from websocket.rate_limiter import RateLimiter, RateLimitConfig
from websocket.pool import ConnectionPool, PoolConfig
from fastapi.testclient import TestClient
from main import app

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
def recovery_manager():
    config = RecoveryConfig(
        session_timeout=300,  # 5 minutes
        max_missed_heartbeats=3,
        heartbeat_interval=30,
        recovery_buffer_size=50,
        max_recovery_attempts=3
    )
    return RecoveryManager(config)

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
    response = test_client.get("/ws/status")
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
    response = test_client.get("/ws/metrics")
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
    response = test_client.get("/ws/active-users")
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert isinstance(data["users"], list)

def test_typing_users_endpoint(test_client):
    """Test the typing users endpoint."""
    response = test_client.get("/ws/typing-users")
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert isinstance(data["users"], list)

def test_client_status_endpoint_not_found(test_client):
    """Test the client status endpoint with non-existent client."""
    response = test_client.get("/ws/client/nonexistent/status")
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

@pytest.mark.asyncio
async def test_recovery_manager_session_restore(recovery_manager, test_user):
    """Test session state recovery after disconnection."""
    client_id = test_user.id
    last_sequence = 5
    
    # Create initial session state
    session = SessionState(
        client_id=client_id,
        user_id=test_user.id,
        channel="test_channel",
        last_sequence=last_sequence,
        last_heartbeat=datetime.utcnow(),
        missed_heartbeats=0,
        recovery_attempts=0,
        message_buffer=[]
    )
    
    # Register session
    await recovery_manager.register_session(session)
    
    # Verify session can be recovered
    recovered = await recovery_manager.recover_session(client_id, last_sequence)
    assert recovered is not None
    assert recovered.client_id == client_id
    assert recovered.last_sequence == last_sequence
    assert recovered.channel == "test_channel"

@pytest.mark.asyncio
async def test_message_retry_system(connection_manager, test_user):
    """Test message retry mechanism for failed deliveries."""
    client_id = test_user.id
    message = Message(
        id="test-msg-1",
        content="Test message",
        timestamp=datetime.utcnow()
    )
    
    # Simulate failed message
    await connection_manager.record_failed_message(client_id, message)
    assert client_id in connection_manager.failed_messages
    assert len(connection_manager.failed_messages[client_id]) == 1
    
    # Attempt retry
    retry_success = await connection_manager.retry_failed_message(client_id, message.id)
    assert retry_success
    assert len(connection_manager.failed_messages[client_id]) == 0

@pytest.mark.asyncio
async def test_heartbeat_monitoring(recovery_manager):
    """Test heartbeat monitoring and missed heartbeat detection."""
    client_id = "test-client"
    session = SessionState(
        client_id=client_id,
        user_id="test-user",
        channel="test_channel",
        last_sequence=1,
        last_heartbeat=datetime.utcnow() - timedelta(seconds=30),
        missed_heartbeats=0,
        recovery_attempts=0,
        message_buffer=[]
    )
    
    await recovery_manager.register_session(session)
    
    # Check missed heartbeats
    await recovery_manager.check_heartbeats()
    updated_session = await recovery_manager.get_session(client_id)
    assert updated_session.missed_heartbeats > 0

@pytest.mark.asyncio
async def test_websocket_full_flow(
    connection_manager,
    rate_limiter,
    connection_pool,
    recovery_manager,
    test_user,
    test_token
):
    """Test complete WebSocket flow including recovery and retries."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Initial connection
    websocket = MockWebSocket()
    client_id = test_user.id
    
    # Connect with rate limiting check
    assert await rate_limiter.can_connect(client_id)
    await connection_manager.connect(websocket, client_id)
    assert client_id in connection_manager.active_connections
    
    # Send message
    message = Message(
        id="test-msg-1",
        content="Test message",
        timestamp=datetime.utcnow()
    )
    await connection_manager.send_personal_message(message, client_id)
    assert len(websocket.sent_messages) == 1
    
    # Simulate disconnect
    await connection_manager.disconnect(client_id)
    assert client_id not in connection_manager.active_connections
    
    # Verify session state saved
    session = await recovery_manager.get_session(client_id)
    assert session is not None
    assert session.client_id == client_id
    
    # Reconnect with recovery
    new_websocket = MockWebSocket()
    await connection_manager.connect(new_websocket, client_id)
    recovered_session = await recovery_manager.recover_session(
        client_id,
        session.last_sequence
    )
    assert recovered_session is not None
    assert recovered_session.client_id == client_id
    
    # Verify connection restored
    assert client_id in connection_manager.active_connections
    assert len(connection_manager.active_connections[client_id].sent_messages) > 0

@pytest.mark.asyncio
async def test_websocket_error_recovery(
    connection_manager,
    recovery_manager,
    test_user
):
    """Test WebSocket error recovery and message retry."""
    client_id = test_user.id
    
    # Create test messages
    messages = [
        Message(
            id=f"msg-{i}",
            content=f"Test message {i}",
            timestamp=datetime.utcnow()
        )
        for i in range(3)
    ]
    
    # Record failed messages
    for msg in messages:
        await connection_manager.record_failed_message(client_id, msg)
    
    assert len(connection_manager.failed_messages[client_id]) == 3
    
    # Attempt recovery of each message
    for msg in messages:
        retry_success = await connection_manager.retry_failed_message(
            client_id,
            msg.id
        )
        assert retry_success
    
    # Verify all messages recovered
    assert len(connection_manager.failed_messages[client_id]) == 0

@pytest.mark.asyncio
async def test_connection_pool_under_load(
    connection_pool,
    rate_limiter,
    test_user
):
    """Test connection pool behavior under high load."""
    class MockWebSocket:
        def __init__(self):
            self.sent_messages = []
            self.closed = False
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Test concurrent connections
    concurrent_clients = 50
    websockets = []
    channels = ["channel1", "channel2", "channel3"]
    
    # Simulate burst of connections
    for i in range(concurrent_clients):
        ws = MockWebSocket()
        channel = channels[i % len(channels)]
        if await connection_pool.can_add_connection(channel):
            assert await connection_pool.add_connection(ws, channel)
            websockets.append((ws, channel))
    
    # Verify pool limits maintained
    assert len(websockets) <= connection_pool.config.max_pool_size
    for channel in channels:
        channel_count = len(connection_pool.channels[channel].connections)
        assert channel_count <= connection_pool.config.max_pool_size / len(channels)

@pytest.mark.asyncio
async def test_message_broadcast_performance(
    connection_pool,
    connection_manager
):
    """Test message broadcasting performance under load."""
    class MockWebSocket:
        def __init__(self):
            self.sent_messages = []
            self.closed = False
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            await asyncio.sleep(0.001)  # Simulate network delay
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Setup test data
    channel = "test_channel"
    num_clients = 20
    num_messages = 50
    
    # Add clients to channel
    websockets = []
    for i in range(num_clients):
        ws = MockWebSocket()
        assert await connection_pool.add_connection(ws, channel)
        websockets.append(ws)
    
    # Broadcast messages
    start_time = datetime.utcnow()
    for i in range(num_messages):
        message = Message(
            id=f"perf-msg-{i}",
            content=f"Performance test message {i}",
            timestamp=datetime.utcnow()
        )
        await connection_pool.broadcast_to_channel(channel, message.dict())
    
    # Wait for message processing
    await asyncio.sleep(1)
    end_time = datetime.utcnow()
    
    # Verify delivery and timing
    processing_time = (end_time - start_time).total_seconds()
    messages_per_second = (num_messages * num_clients) / processing_time
    
    # Assert performance metrics
    assert messages_per_second > 100  # At least 100 messages/second
    for ws in websockets:
        assert len(ws.sent_messages) == num_messages

@pytest.mark.asyncio
async def test_rate_limiter_stress(rate_limiter):
    """Test rate limiter under high concurrency."""
    num_users = 50
    requests_per_user = 20
    
    async def simulate_user_activity(user_id: str):
        success_count = 0
        for _ in range(requests_per_user):
            if await rate_limiter.can_send_message(user_id):
                await rate_limiter.record_message(user_id)
                success_count += 1
            await asyncio.sleep(0.01)
        return success_count
    
    # Run concurrent user simulations
    tasks = []
    for i in range(num_users):
        task = asyncio.create_task(
            simulate_user_activity(f"stress-test-user-{i}")
        )
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    # Verify rate limiting worked
    total_success = sum(results)
    max_possible = num_users * requests_per_user
    assert total_success < max_possible  # Some requests should be rate limited
    assert total_success > 0  # But some should succeed

@pytest.mark.asyncio
async def test_recovery_system_under_load(
    recovery_manager,
    connection_manager,
    test_user
):
    """Test recovery system with multiple concurrent recoveries."""
    num_sessions = 30
    
    # Create and register multiple sessions
    sessions = []
    for i in range(num_sessions):
        session = SessionState(
            client_id=f"load-test-client-{i}",
            user_id=test_user.id,
            channel=f"channel-{i % 3}",
            last_sequence=i,
            last_heartbeat=datetime.utcnow(),
            missed_heartbeats=0,
            recovery_attempts=0,
            message_buffer=[]
        )
        await recovery_manager.register_session(session)
        sessions.append(session)
    
    # Simulate concurrent recovery attempts
    async def attempt_recovery(session: SessionState):
        recovered = await recovery_manager.recover_session(
            session.client_id,
            session.last_sequence
        )
        return recovered is not None
    
    # Run concurrent recoveries
    tasks = []
    for session in sessions:
        task = asyncio.create_task(attempt_recovery(session))
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    # Verify recoveries
    success_count = sum(1 for r in results if r)
    assert success_count == num_sessions  # All sessions should recover
    
    # Verify session cleanup
    await recovery_manager.cleanup_expired_sessions()
    active_sessions = len(recovery_manager.sessions)
    assert active_sessions == num_sessions  # No sessions should be expired

@pytest.mark.asyncio
async def test_websocket_security_authentication(
    connection_manager,
    test_user,
    auth_service
):
    """Test WebSocket security with invalid authentication."""
    class MockWebSocket:
        def __init__(self, token=None):
            self.query_params = {"token": token} if token else {}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Test connection without token
    websocket = MockWebSocket()
    with pytest.raises(Exception) as exc:
        await connection_manager.connect(websocket, "test-client")
    assert "Unauthorized" in str(exc.value)
    
    # Test connection with expired token
    expired_payload = {
        "sub": test_user.id,
        "email": test_user.email,
        "exp": datetime.utcnow().timestamp() - 3600  # Expired 1 hour ago
    }
    expired_token = jwt.encode(expired_payload, auth_service.jwt_secret, algorithm="HS256")
    websocket = MockWebSocket(token=expired_token)
    with pytest.raises(Exception) as exc:
        await connection_manager.connect(websocket, "test-client")
    assert "Token expired" in str(exc.value)
    
    # Test connection with invalid signature
    invalid_token = jwt.encode(
        expired_payload,
        "wrong_secret",
        algorithm="HS256"
    )
    websocket = MockWebSocket(token=invalid_token)
    with pytest.raises(Exception) as exc:
        await connection_manager.connect(websocket, "test-client")
    assert "Invalid token" in str(exc.value)

@pytest.mark.asyncio
async def test_websocket_security_authorization(
    connection_manager,
    connection_pool,
    test_user,
    test_token
):
    """Test WebSocket security with invalid authorization."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    websocket = MockWebSocket()
    client_id = test_user.id
    
    # Connect with valid token
    await connection_manager.connect(websocket, client_id)
    
    # Test sending to unauthorized channel
    with pytest.raises(Exception) as exc:
        await connection_pool.broadcast_to_channel(
            "private_channel",
            {"content": "Unauthorized message"}
        )
    assert "Not authorized" in str(exc.value)
    
    # Test sending with invalid user
    with pytest.raises(Exception) as exc:
        await connection_manager.send_personal_message(
            Message(
                id="test-msg",
                content="Unauthorized message",
                timestamp=datetime.utcnow()
            ),
            "invalid_user_id"
        )
    assert "Invalid user" in str(exc.value)

@pytest.mark.asyncio
async def test_websocket_security_rate_limiting(
    connection_manager,
    rate_limiter,
    test_user,
    test_token
):
    """Test WebSocket security with rate limiting."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Test connection rate limiting
    websockets = []
    for _ in range(rate_limiter.config.max_connections_per_user + 1):
        websocket = MockWebSocket()
        if len(websockets) < rate_limiter.config.max_connections_per_user:
            await connection_manager.connect(websocket, test_user.id)
            websockets.append(websocket)
        else:
            with pytest.raises(Exception) as exc:
                await connection_manager.connect(websocket, test_user.id)
            assert "Connection limit exceeded" in str(exc.value)
    
    # Test message rate limiting
    websocket = websockets[0]
    for _ in range(rate_limiter.config.max_messages_per_minute + 1):
        if _ < rate_limiter.config.max_messages_per_minute:
            await rate_limiter.record_message(test_user.id)
        else:
            with pytest.raises(Exception) as exc:
                await rate_limiter.record_message(test_user.id)
            assert "Rate limit exceeded" in str(exc.value)
    
    # Test burst protection
    burst_messages = []
    for i in range(rate_limiter.config.burst_limit + 1):
        if i < rate_limiter.config.burst_limit:
            assert await rate_limiter.can_send_message(test_user.id)
            burst_messages.append(i)
        else:
            assert not await rate_limiter.can_send_message(test_user.id)

@pytest.mark.asyncio
async def test_websocket_security_input_validation(
    connection_manager,
    test_user,
    test_token
):
    """Test WebSocket security with input validation."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    websocket = MockWebSocket()
    await connection_manager.connect(websocket, test_user.id)
    
    # Test message size limit
    large_content = "x" * (1024 * 1024 + 1)  # > 1MB
    with pytest.raises(Exception) as exc:
        await connection_manager.send_personal_message(
            Message(
                id="large-msg",
                content=large_content,
                timestamp=datetime.utcnow()
            ),
            test_user.id
        )
    assert "Message too large" in str(exc.value)
    
    # Test invalid message format
    with pytest.raises(Exception) as exc:
        await connection_manager.handle_message(
            websocket,
            "invalid json {[]}"
        )
    assert "Invalid message format" in str(exc.value)
    
    # Test message validation
    with pytest.raises(Exception) as exc:
        await connection_manager.send_personal_message(
            Message(
                id="",  # Invalid empty ID
                content=None,  # Invalid null content
                timestamp=datetime.utcnow()
            ),
            test_user.id
        )
    assert "Invalid message" in str(exc.value)

@pytest.mark.asyncio
async def test_websocket_metrics_collection(
    connection_manager,
    connection_pool,
    rate_limiter,
    test_user,
    test_token
):
    """Test WebSocket metrics collection and monitoring."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Setup test scenario
    websocket = MockWebSocket()
    client_id = test_user.id
    
    # Track initial metrics
    initial_metrics = await connection_manager.get_metrics()
    
    # Generate activity
    await connection_manager.connect(websocket, client_id)
    message = Message(
        id="test-msg",
        content="Test message",
        timestamp=datetime.utcnow()
    )
    await connection_manager.send_personal_message(message, client_id)
    await connection_manager.set_typing_status(client_id, True)
    await asyncio.sleep(0.1)
    await connection_manager.disconnect(client_id)
    
    # Get updated metrics
    final_metrics = await connection_manager.get_metrics()
    
    # Verify metric changes
    assert final_metrics["connections"]["total"] > initial_metrics["connections"]["total"]
    assert final_metrics["messages"]["sent"] > initial_metrics["messages"]["sent"]
    assert final_metrics["events"]["typing"] > initial_metrics["events"]["typing"]
    assert "latency" in final_metrics
    assert "memory_usage" in final_metrics
    assert "error_rate" in final_metrics

@pytest.mark.asyncio
async def test_websocket_error_logging(
    connection_manager,
    test_user,
    test_token
):
    """Test WebSocket error logging and monitoring."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Setup test scenario
    websocket = MockWebSocket()
    client_id = test_user.id
    
    # Track initial error metrics
    initial_errors = await connection_manager.get_error_metrics()
    
    # Generate errors
    try:
        await connection_manager.send_personal_message(
            Message(id="", content=None, timestamp=datetime.utcnow()),
            client_id
        )
    except Exception:
        pass
    
    try:
        await connection_manager.handle_message(websocket, "invalid json")
    except Exception:
        pass
    
    # Get updated error metrics
    final_errors = await connection_manager.get_error_metrics()
    
    # Verify error logging
    assert final_errors["total"] > initial_errors["total"]
    assert final_errors["validation_errors"] > initial_errors["validation_errors"]
    assert final_errors["parse_errors"] > initial_errors["parse_errors"]
    assert "error_timestamps" in final_errors
    assert "error_types" in final_errors

@pytest.mark.asyncio
async def test_websocket_performance_monitoring(
    connection_pool,
    test_user
):
    """Test WebSocket performance monitoring."""
    class MockWebSocket:
        def __init__(self):
            self.sent_messages = []
            self.closed = False
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            await asyncio.sleep(0.001)  # Simulate network delay
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Setup test data
    channel = "test_channel"
    num_clients = 10
    num_messages = 20
    
    # Track initial performance metrics
    initial_perf = await connection_pool.get_performance_metrics()
    
    # Generate load
    websockets = []
    for i in range(num_clients):
        ws = MockWebSocket()
        assert await connection_pool.add_connection(ws, channel)
        websockets.append(ws)
    
    for i in range(num_messages):
        message = Message(
            id=f"perf-msg-{i}",
            content=f"Performance test message {i}",
            timestamp=datetime.utcnow()
        )
        await connection_pool.broadcast_to_channel(channel, message.dict())
    
    # Get updated performance metrics
    final_perf = await connection_pool.get_performance_metrics()
    
    # Verify performance monitoring
    assert "message_latency" in final_perf
    assert "broadcast_time" in final_perf
    assert "cpu_usage" in final_perf
    assert "memory_usage" in final_perf
    assert final_perf["total_messages"] > initial_perf["total_messages"]
    assert final_perf["active_connections"] > initial_perf["active_connections"]

@pytest.mark.asyncio
async def test_websocket_health_monitoring(
    connection_manager,
    connection_pool,
    recovery_manager
):
    """Test WebSocket health monitoring."""
    # Get system health metrics
    health = await connection_manager.get_health_metrics()
    
    # Verify health monitoring
    assert "status" in health
    assert "uptime" in health
    assert "last_error" in health
    assert "error_rate" in health
    assert "component_status" in health
    
    # Verify component health
    components = health["component_status"]
    assert "connection_manager" in components
    assert "connection_pool" in components
    assert "recovery_manager" in components
    
    # Verify detailed metrics
    assert "active_connections" in health
    assert "message_queue_size" in health
    assert "failed_message_count" in health
    assert "recovery_success_rate" in health
    assert "average_latency" in health

@pytest.mark.asyncio
async def test_websocket_complete_system_integration(
    connection_manager,
    connection_pool,
    rate_limiter,
    recovery_manager,
    test_user,
    test_token
):
    """Test complete WebSocket system integration with all components."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            await asyncio.sleep(0.001)  # Simulate network delay
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # 1. Initial Connection & Authentication
    websocket = MockWebSocket()
    client_id = test_user.id
    
    # Verify rate limiting before connection
    assert await rate_limiter.can_connect(client_id)
    
    # Connect and verify
    await connection_manager.connect(websocket, client_id)
    assert client_id in connection_manager.active_connections
    
    # 2. Channel Management
    channel = "test_channel"
    assert await connection_pool.add_connection(websocket, channel)
    assert websocket in connection_pool.channels[channel].connections
    
    # 3. Message Handling
    message = Message(
        id="test-msg-1",
        content="Test message",
        timestamp=datetime.utcnow()
    )
    
    # Send message and verify delivery
    await connection_pool.broadcast_to_channel(channel, message.dict())
    assert len(websocket.sent_messages) == 1
    
    # 4. Real-time Features
    await connection_manager.set_typing_status(client_id, True)
    assert client_id in connection_manager.typing_status
    
    await connection_manager.mark_as_read(client_id, message.id)
    assert message.id in connection_manager.read_receipts
    
    # 5. Disconnection & Recovery
    await connection_manager.disconnect(client_id)
    assert client_id not in connection_manager.active_connections
    
    # Verify session state saved
    session = await recovery_manager.get_session(client_id)
    assert session is not None
    assert session.client_id == client_id
    
    # 6. Reconnection & State Recovery
    new_websocket = MockWebSocket()
    await connection_manager.connect(new_websocket, client_id)
    
    recovered_session = await recovery_manager.recover_session(
        client_id,
        session.last_sequence
    )
    assert recovered_session is not None
    assert recovered_session.client_id == client_id
    
    # 7. Error Handling & Recovery
    # Simulate message failure
    failed_message = Message(
        id="failed-msg",
        content="Failed message",
        timestamp=datetime.utcnow()
    )
    await connection_manager.record_failed_message(client_id, failed_message)
    
    # Verify retry mechanism
    retry_success = await connection_manager.retry_failed_message(
        client_id,
        failed_message.id
    )
    assert retry_success
    assert len(connection_manager.failed_messages.get(client_id, [])) == 0
    
    # 8. Metrics & Monitoring
    metrics = await connection_manager.get_metrics()
    assert metrics["connections"]["total"] > 0
    assert metrics["messages"]["sent"] > 0
    
    health = await connection_manager.get_health_metrics()
    assert health["status"] == "healthy"
    assert "connection_manager" in health["component_status"]
    
    # 9. Cleanup & Resource Management
    await connection_manager.disconnect(client_id)
    await recovery_manager.cleanup_expired_sessions()
    assert client_id not in connection_manager.active_connections

@pytest.mark.asyncio
async def test_websocket_concurrent_operations(
    connection_manager,
    connection_pool,
    rate_limiter,
    recovery_manager,
    test_user,
    test_token
):
    """Test WebSocket system with concurrent operations."""
    class MockWebSocket:
        def __init__(self):
            self.query_params = {"token": test_token}
            self.headers = {}
            self.closed = False
            self.sent_messages = []
            
        async def accept(self):
            pass
            
        async def send_text(self, text):
            self.sent_messages.append(text)
            await asyncio.sleep(0.001)  # Simulate network delay
            
        async def close(self, code=None, reason=None):
            self.closed = True
    
    # Setup test data
    num_clients = 10
    num_messages = 5
    channels = ["channel1", "channel2"]
    
    # 1. Concurrent Connections
    websockets = []
    for i in range(num_clients):
        ws = MockWebSocket()
        client_id = f"{test_user.id}-{i}"
        channel = channels[i % len(channels)]
        
        # Connect and add to channel
        if await rate_limiter.can_connect(client_id):
            await connection_manager.connect(ws, client_id)
            assert await connection_pool.add_connection(ws, channel)
            websockets.append((ws, client_id, channel))
    
    # 2. Concurrent Message Broadcasting
    messages = []
    for i in range(num_messages):
        message = Message(
            id=f"concurrent-msg-{i}",
            content=f"Concurrent message {i}",
            timestamp=datetime.utcnow()
        )
        messages.append(message)
    
    # Broadcast messages to all channels concurrently
    broadcast_tasks = []
    for channel in channels:
        for message in messages:
            task = asyncio.create_task(
                connection_pool.broadcast_to_channel(channel, message.dict())
            )
            broadcast_tasks.append(task)
    
    await asyncio.gather(*broadcast_tasks)
    
    # 3. Verify Message Delivery
    for ws, _, channel in websockets:
        assert len(ws.sent_messages) == num_messages
    
    # 4. Concurrent State Updates
    update_tasks = []
    for _, client_id, _ in websockets:
        task = asyncio.create_task(
            connection_manager.set_typing_status(client_id, True)
        )
        update_tasks.append(task)
    
    await asyncio.gather(*update_tasks)
    
    # Verify state updates
    for _, client_id, _ in websockets:
        assert client_id in connection_manager.typing_status
    
    # 5. Concurrent Disconnections & Recovery
    disconnect_tasks = []
    for ws, client_id, _ in websockets:
        task = asyncio.create_task(connection_manager.disconnect(client_id))
        disconnect_tasks.append(task)
    
    await asyncio.gather(*disconnect_tasks)
    
    # Verify all disconnected
    for _, client_id, _ in websockets:
        assert client_id not in connection_manager.active_connections
    
    # 6. Verify Session States
    for _, client_id, _ in websockets:
        session = await recovery_manager.get_session(client_id)
        assert session is not None
        assert session.client_id == client_id
    
    # 7. Concurrent Reconnections
    reconnect_tasks = []
    for _, client_id, _ in websockets:
        ws = MockWebSocket()
        task = asyncio.create_task(connection_manager.connect(ws, client_id))
        reconnect_tasks.append((task, client_id))
    
    await asyncio.gather(*(task for task, _ in reconnect_tasks))
    
    # Verify all reconnected
    for _, client_id in reconnect_tasks:
        assert client_id in connection_manager.active_connections
    
    # 8. Verify System Health
    health = await connection_manager.get_health_metrics()
    assert health["status"] == "healthy"
    assert health["active_connections"] == len(websockets)
    
    # 9. Cleanup
    await recovery_manager.cleanup_expired_sessions()
    metrics = await connection_manager.get_metrics()
    assert metrics["connections"]["active"] == len(websockets) 