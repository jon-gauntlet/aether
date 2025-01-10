import pytest
import asyncio
import jwt
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from cryptography.fernet import Fernet

from lib.autonomic.security import (
    SecurityManager,
    SecurityStore,
    AccessControl,
    Credential,
    Permission,
    SecurityConfig,
    SecurityToken,
    SecurityEvent,
    SecurityLevel
)

@pytest.fixture
def security_store(tmp_path):
    """Create security store instance with temporary storage"""
    store = SecurityStore()
    store.storage_path = str(tmp_path / "security")
    store._init_storage()
    return store

@pytest.fixture
def security_manager(security_store):
    """Create security manager instance"""
    config = SecurityConfig(
        token_expiration=timedelta(hours=1),
        max_failed_attempts=3,
        lockout_duration=timedelta(minutes=15),
        min_password_length=12,
        require_mfa=True,
        encryption_key=Fernet.generate_key()
    )
    manager = SecurityManager(config)
    manager.store = security_store
    return manager

@pytest.fixture
def credentials():
    """Create test credentials"""
    now = datetime.now()
    return [
        Credential(
            id="test_cred_001",
            username="test_user",
            password_hash="hashed_password",
            mfa_secret="mfa_secret",
            permissions=[
                Permission(
                    resource="system",
                    action="read",
                    conditions={"level": "user"}
                )
            ],
            metadata={
                'created_by': 'test',
                'last_password_change': now
            },
            created_at=now,
            updated_at=now,
            active=True
        ),
        Credential(
            id="test_cred_002",
            username="admin_user",
            password_hash="admin_password_hash",
            mfa_secret="admin_mfa_secret",
            permissions=[
                Permission(
                    resource="*",
                    action="*",
                    conditions={"level": "admin"}
                )
            ],
            metadata={
                'created_by': 'system',
                'last_password_change': now
            },
            created_at=now,
            updated_at=now,
            active=True
        )
    ]

@pytest.mark.asyncio
async def test_store_credential(security_store, credentials):
    """Test credential storage"""
    # Store credentials
    for cred in credentials:
        success = await security_store.store_credential(cred)
        assert success

    # Retrieve credentials
    for cred in credentials:
        retrieved = await security_store.get_credential(cred.id)
        assert retrieved is not None
        assert retrieved.id == cred.id
        assert retrieved.username == cred.username
        assert len(retrieved.permissions) == len(cred.permissions)

@pytest.mark.asyncio
async def test_password_hashing(security_manager):
    """Test password hashing"""
    # Hash password
    password = "TestPassword123!"
    hashed = await security_manager.hash_password(password)
    assert hashed != password

    # Verify password
    is_valid = await security_manager.verify_password(password, hashed)
    assert is_valid

@pytest.mark.asyncio
async def test_mfa_handling(security_manager):
    """Test MFA handling"""
    # Generate MFA secret
    secret = await security_manager.generate_mfa_secret()
    assert secret is not None

    # Generate and verify MFA code
    code = await security_manager.generate_mfa_code(secret)
    is_valid = await security_manager.verify_mfa_code(secret, code)
    assert is_valid

@pytest.mark.asyncio
async def test_token_management(security_manager, credentials):
    """Test token management"""
    # Generate token
    cred = credentials[0]
    token = await security_manager.generate_token(cred)
    assert isinstance(token, SecurityToken)
    assert token.credential_id == cred.id

    # Verify token
    is_valid = await security_manager.verify_token(token.token)
    assert is_valid

    # Decode token
    decoded = await security_manager.decode_token(token.token)
    assert decoded['credential_id'] == cred.id

@pytest.mark.asyncio
async def test_permission_checking(security_manager, credentials):
    """Test permission checking"""
    # Add credentials
    for cred in credentials:
        await security_manager.store.store_credential(cred)

    # Check user permissions
    user_cred = credentials[0]
    has_permission = await security_manager.check_permission(
        user_cred.id,
        resource="system",
        action="read"
    )
    assert has_permission

    # Check admin permissions
    admin_cred = credentials[1]
    has_permission = await security_manager.check_permission(
        admin_cred.id,
        resource="any_resource",
        action="any_action"
    )
    assert has_permission

@pytest.mark.asyncio
async def test_access_control(security_manager, credentials):
    """Test access control"""
    # Set up access control
    access_control = AccessControl(security_manager)

    # Add credentials
    for cred in credentials:
        await security_manager.store.store_credential(cred)

    # Test user access
    user_cred = credentials[0]
    token = await security_manager.generate_token(user_cred)
    
    @access_control.require_permission("system", "read")
    async def protected_function(token):
        return True

    result = await protected_function(token.token)
    assert result

@pytest.mark.asyncio
async def test_failed_login_handling(security_manager, credentials):
    """Test failed login handling"""
    # Add credential
    cred = credentials[0]
    await security_manager.store.store_credential(cred)

    # Attempt multiple failed logins
    for _ in range(security_manager.config.max_failed_attempts):
        with pytest.raises(Exception):
            await security_manager.authenticate(
                username=cred.username,
                password="wrong_password",
                mfa_code="wrong_code"
            )

    # Verify account is locked
    is_locked = await security_manager.is_account_locked(cred.id)
    assert is_locked

@pytest.mark.asyncio
async def test_security_event_logging(security_manager, credentials):
    """Test security event logging"""
    # Set up event handler
    events = []
    def event_handler(event):
        events.append(event)

    security_manager.on_security_event(event_handler)

    # Trigger security event
    event = SecurityEvent(
        type="login_attempt",
        source="test",
        credential_id=credentials[0].id,
        success=False,
        metadata={'ip': '127.0.0.1'}
    )
    await security_manager.log_security_event(event)

    # Verify event logging
    assert len(events) == 1
    assert events[0].type == "login_attempt"

@pytest.mark.asyncio
async def test_credential_rotation(security_manager, credentials):
    """Test credential rotation"""
    # Add credential
    cred = credentials[0]
    await security_manager.store.store_credential(cred)

    # Rotate credentials
    new_password = "NewTestPassword123!"
    new_mfa_secret = await security_manager.generate_mfa_secret()
    
    success = await security_manager.rotate_credentials(
        cred.id,
        new_password=new_password,
        new_mfa_secret=new_mfa_secret
    )
    assert success

    # Verify rotation
    updated = await security_manager.store.get_credential(cred.id)
    assert updated.password_hash != cred.password_hash
    assert updated.mfa_secret != cred.mfa_secret

@pytest.mark.asyncio
async def test_encryption(security_manager):
    """Test data encryption"""
    # Test data
    sensitive_data = "sensitive information"

    # Encrypt data
    encrypted = await security_manager.encrypt_data(sensitive_data)
    assert encrypted != sensitive_data

    # Decrypt data
    decrypted = await security_manager.decrypt_data(encrypted)
    assert decrypted == sensitive_data

@pytest.mark.asyncio
async def test_security_level_enforcement(security_manager, credentials):
    """Test security level enforcement"""
    # Add credentials
    for cred in credentials:
        await security_manager.store.store_credential(cred)

    # Set security level
    await security_manager.set_security_level(SecurityLevel.HIGH)

    # Verify stricter requirements
    with pytest.raises(Exception):
        await security_manager.authenticate(
            username=credentials[0].username,
            password="short",  # Too short for HIGH security
            mfa_code="123456"
        )

@pytest.mark.asyncio
async def test_manager_start_stop(security_manager):
    """Test manager start/stop"""
    # Start manager
    await security_manager.start()
    assert security_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await security_manager.stop()
    assert not security_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(security_manager):
    """Test manager error handling"""
    # Mock store.store_credential to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    security_manager.store.store_credential = mock_store

    # Start manager
    await security_manager.start()
    assert security_manager.active

    # Try to store credential (should handle error gracefully)
    await security_manager.store_credential(Credential(
        id="test",
        username="test",
        password_hash="test",
        mfa_secret="test",
        permissions=[]
    ))

    # Verify manager is still running
    assert security_manager.active

    # Stop manager
    await security_manager.stop()
    assert not security_manager.active 