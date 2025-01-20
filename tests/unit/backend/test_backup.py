"""Tests for backup system.


"""
import os
import json
import pytest
import tempfile
import asyncio
import httpx
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from rag_aether.core.backup import (
    BackupConfig,
    BackupManager
)

# Mock JWT token for Supabase
MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

@pytest.fixture
def backup_dir():
    """Create temporary backup directory."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir

@pytest.fixture
def backup_config(backup_dir):
    """Create backup configuration."""
    return BackupConfig(
        backup_dir=backup_dir,
        retention_days=1,
        compression_level=1,
        verify_backups=True,
        supabase_key=MOCK_JWT,
        supabase_url="http://mock-supabase"
    )

@pytest.fixture
def mock_redis():
    """Create mock Redis client."""
    mock = MagicMock()
    mock.keys.return_value = ["key1", "key2"]
    mock.dump.return_value = b"test_data"
    return mock

class MockResponse:
    def __init__(self):
        self.status_code = 200
        self._json = {"data": [{"id": 1, "data": "test"}]}

    def json(self):
        return self._json

    @property
    def is_success(self):
        return True

class MockTransport(httpx.BaseTransport):
    def __init__(self):
        self.response = MockResponse()

    def handle_request(self, request):
        return self.response

@pytest.fixture
def mock_supabase():
    """Create mock Supabase client."""
    mock = MagicMock()
    
    # Mock response object
    response = MagicMock()
    response.data = [{"id": 1, "data": "test"}]
    response.json = MagicMock(return_value={"data": [{"id": 1, "data": "test"}]})
    response.is_success = True
    
    # Mock select query builder
    select_builder = MagicMock()
    select_builder.execute = AsyncMock(return_value=response)
    
    # Mock delete query builder
    delete_builder = MagicMock()
    delete_builder.neq = MagicMock(return_value=MagicMock(execute=AsyncMock()))
    
    # Mock insert query builder
    insert_builder = MagicMock()
    insert_builder.execute = AsyncMock()
    
    # Mock table method
    table = MagicMock()
    table.select = MagicMock(return_value=select_builder)
    table.delete = MagicMock(return_value=delete_builder)
    table.insert = MagicMock(return_value=insert_builder)
    
    # Set up mock Supabase client
    mock.table = MagicMock(return_value=table)
    
    # Set up mock transport
    mock._session = MagicMock()
    mock._session.transport = MockTransport()
    
    return mock

@pytest.fixture
def backup_manager(backup_config, mock_redis, mock_supabase):
    """Create backup manager with mocked dependencies."""
    with patch("redis.from_url", return_value=mock_redis), \
         patch("supabase.create_client", return_value=mock_supabase):
        manager = BackupManager(backup_config)
        
        # Mock Redis client
        manager.redis = Mock()
        manager.redis.keys = AsyncMock(return_value=[b"key1", b"key2"])
        manager.redis.get = AsyncMock(return_value=b"value")
        manager.redis.set = AsyncMock()
        
        # Mock Supabase client
        mock_response = Mock()
        mock_response.json.return_value = {"data": [{"id": 1, "data": "test"}]}
        mock_response.is_success = True
        
        mock_execute = AsyncMock(return_value=mock_response)
        mock_select = Mock(return_value=Mock(execute=mock_execute))
        mock_table = Mock(return_value=Mock(select=mock_select))
        
        manager.supabase.table = mock_table
        
        yield manager

@pytest.mark.asyncio
async def test_create_backup(backup_manager):
    """Test backup creation."""
    manifest = await backup_manager.create_backup()
    
    assert manifest["backup_name"].startswith("backup_")
    assert "timestamp" in manifest
    assert "checksum" in manifest
    assert "size_bytes" in manifest
    assert manifest["components"] == ["redis", "supabase"]
    assert manifest["compression"] == "gzip"
    assert manifest["compression_level"] == 1
    
    # Verify files were created
    backup_path = Path(backup_manager.config.backup_dir) / f"{manifest['backup_name']}.tar.gz"
    manifest_path = Path(backup_manager.config.backup_dir) / f"{manifest['backup_name']}_manifest.json"
    
    assert backup_path.exists()
    assert manifest_path.exists()

@pytest.mark.asyncio
async def test_restore_backup(backup_manager):
    """Test backup restoration."""
    # Create backup first
    manifest = await backup_manager.create_backup()
    
    # Restore backup
    success = await backup_manager.restore_backup(manifest["backup_name"])
    assert success
    
    # Verify Redis restore
    backup_manager.redis.flushall.assert_called_once()
    backup_manager.redis.restore.assert_called()
    
    # Verify Supabase restore
    backup_manager.supabase.table.return_value.delete.return_value.neq.return_value.execute.assert_called()
    backup_manager.supabase.table.return_value.insert.return_value.execute.assert_called()

def test_list_backups(backup_manager):
    """Test backup listing."""
    # Create test manifests
    manifest1 = {
        "backup_name": "backup_20240321_000000",
        "timestamp": "2024-03-21T00:00:00",
        "checksum": "test"
    }
    manifest2 = {
        "backup_name": "backup_20240321_010000",
        "timestamp": "2024-03-21T01:00:00",
        "checksum": "test"
    }
    
    manifest_dir = Path(backup_manager.config.backup_dir)
    with open(manifest_dir / "backup_20240321_000000_manifest.json", "w") as f:
        json.dump(manifest1, f)
    with open(manifest_dir / "backup_20240321_010000_manifest.json", "w") as f:
        json.dump(manifest2, f)
    
    backups = backup_manager.list_backups()
    assert len(backups) == 2
    assert backups[0]["backup_name"] == "backup_20240321_010000"
    assert backups[1]["backup_name"] == "backup_20240321_000000"

def test_verify_backups(backup_manager):
    """Test backup verification."""
    # Create test backup and manifest
    backup_path = Path(backup_manager.config.backup_dir) / "backup_test.tar.gz"
    manifest_path = Path(backup_manager.config.backup_dir) / "backup_test_manifest.json"
    
    # Create dummy backup file
    with open(backup_path, "wb") as f:
        f.write(b"test data")
    
    # Calculate actual checksum
    checksum = backup_manager._calculate_checksum(backup_path)
    
    # Create manifest with correct checksum
    manifest = {
        "backup_name": "backup_test",
        "timestamp": "2024-03-21T00:00:00",
        "checksum": checksum
    }
    
    with open(manifest_path, "w") as f:
        json.dump(manifest, f)
    
    # Verify backups
    results = backup_manager.verify_all_backups()
    assert results["backup_test"] == True

def test_clean_old_backups(backup_manager):
    """Test cleanup of old backups."""
    # Create old backup
    old_date = datetime.now() - timedelta(days=2)
    old_name = f"backup_{old_date.strftime('%Y%m%d_%H%M%S')}"
    old_backup = Path(backup_manager.config.backup_dir) / f"{old_name}.tar.gz"
    old_manifest = Path(backup_manager.config.backup_dir) / f"{old_name}_manifest.json"
    
    old_backup.touch()
    with open(old_manifest, "w") as f:
        json.dump({
            "backup_name": old_name,
            "timestamp": (datetime.now() - timedelta(days=2)).isoformat()
        }, f)
    
    # Create new backup
    new_date = datetime.now()
    new_name = f"backup_{new_date.strftime('%Y%m%d_%H%M%S')}"
    new_backup = Path(backup_manager.config.backup_dir) / f"{new_name}.tar.gz"
    new_manifest = Path(backup_manager.config.backup_dir) / f"{new_name}_manifest.json"
    
    new_backup.touch()
    with open(new_manifest, "w") as f:
        json.dump({
            "backup_name": new_name,
            "timestamp": datetime.now().isoformat()
        }, f)
    
    # Clean old backups
    backup_manager._clean_old_backups()
    
    # Verify old backup was removed and new backup remains
    assert not old_backup.exists()
    assert not old_manifest.exists()
    assert new_backup.exists()
    assert new_manifest.exists()

@pytest.mark.asyncio
async def test_backup_failure_cleanup(backup_manager):
    """Test cleanup on backup failure."""
    # Mock Redis to raise an error
    backup_manager.redis.keys.side_effect = Exception("Redis error")
    
    # Attempt backup
    with pytest.raises(Exception):
        await backup_manager.create_backup()
    
    # Verify no files were left behind
    backup_files = list(Path(backup_manager.config.backup_dir).glob("backup_*"))
    assert len(backup_files) == 0

@pytest.mark.asyncio
async def test_restore_nonexistent_backup(backup_manager):
    """Test restore of nonexistent backup."""
    with pytest.raises(ValueError, match="Backup not found"):
        await backup_manager.restore_backup("nonexistent") 