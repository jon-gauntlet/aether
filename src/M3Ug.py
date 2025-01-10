import pytest
import asyncio
import os
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.config import (
    ConfigManager,
    ConfigStore,
    ConfigProfile,
    ConfigChange,
    ValidationResult
)

@pytest.fixture
def config_store(tmp_path):
    """Create config store instance with temporary storage"""
    store = ConfigStore()
    store.storage_path = str(tmp_path / "configs")
    store._init_storage()
    return store

@pytest.fixture
def config_manager(config_store):
    """Create config manager instance"""
    manager = ConfigManager()
    manager.store = config_store
    return manager

@pytest.fixture
def config_profiles():
    """Create test config profiles"""
    now = datetime.now()
    return [
        ConfigProfile(
            id="test_profile_001",
            name="development",
            settings={
                'metrics': {
                    'collection_interval': 60.0,
                    'storage_interval': 300.0,
                    'max_samples': 1000
                },
                'optimization': {
                    'min_cpu_threshold': 70.0,
                    'max_cpu_threshold': 90.0,
                    'min_memory_threshold': 60.0,
                    'max_memory_threshold': 85.0
                },
                'learning': {
                    'min_confidence': 0.7,
                    'max_patterns': 100,
                    'learning_rate': 0.01
                }
            },
            metadata={
                'environment': 'development',
                'version': '1.0.0'
            },
            created_at=now,
            updated_at=now,
            active=True
        ),
        ConfigProfile(
            id="test_profile_002",
            name="production",
            settings={
                'metrics': {
                    'collection_interval': 30.0,
                    'storage_interval': 150.0,
                    'max_samples': 2000
                },
                'optimization': {
                    'min_cpu_threshold': 60.0,
                    'max_cpu_threshold': 80.0,
                    'min_memory_threshold': 50.0,
                    'max_memory_threshold': 75.0
                },
                'learning': {
                    'min_confidence': 0.8,
                    'max_patterns': 200,
                    'learning_rate': 0.005
                }
            },
            metadata={
                'environment': 'production',
                'version': '1.0.0'
            },
            created_at=now,
            updated_at=now,
            active=False
        )
    ]

@pytest.mark.asyncio
async def test_store_config_profile(config_store, config_profiles):
    """Test config profile storage"""
    # Store profiles
    for profile in config_profiles:
        success = await config_store.store_profile(profile)
        assert success

    # Retrieve profiles
    for profile in config_profiles:
        retrieved = await config_store.get_profile(profile.id)
        assert retrieved is not None
        assert retrieved.id == profile.id
        assert retrieved.name == profile.name
        assert retrieved.settings == profile.settings

@pytest.mark.asyncio
async def test_update_config_profile(config_store, config_profiles):
    """Test config profile update"""
    # Store initial profile
    profile = config_profiles[0]
    await config_store.store_profile(profile)

    # Update profile
    profile.settings['metrics']['collection_interval'] = 45.0
    success = await config_store.update_profile(profile)
    assert success

    # Verify update
    updated = await config_store.get_profile(profile.id)
    assert updated.settings['metrics']['collection_interval'] == 45.0

@pytest.mark.asyncio
async def test_validate_config(config_manager, config_profiles):
    """Test config validation"""
    # Validate valid profile
    profile = config_profiles[0]
    result = await config_manager.validate_config(profile)
    assert isinstance(result, ValidationResult)
    assert result.valid
    assert len(result.errors) == 0

    # Validate invalid profile
    invalid_profile = config_profiles[0].copy()
    invalid_profile.settings['metrics']['collection_interval'] = -1.0
    result = await config_manager.validate_config(invalid_profile)
    assert not result.valid
    assert len(result.errors) > 0

@pytest.mark.asyncio
async def test_apply_config(config_manager, config_profiles):
    """Test config application"""
    # Apply config profile
    profile = config_profiles[0]
    success = await config_manager.apply_config(profile)
    assert success

    # Verify active profile
    active = await config_manager.get_active_profile()
    assert active is not None
    assert active.id == profile.id
    assert active.active

@pytest.mark.asyncio
async def test_track_config_changes(config_manager, config_profiles):
    """Test config change tracking"""
    # Apply initial config
    profile = config_profiles[0]
    await config_manager.apply_config(profile)

    # Make changes
    profile.settings['metrics']['collection_interval'] = 45.0
    await config_manager.apply_config(profile)

    # Get change history
    start_time = datetime.now() - timedelta(hours=1)
    end_time = datetime.now()
    changes = await config_manager.get_config_changes(start_time, end_time)
    
    assert isinstance(changes, list)
    assert len(changes) > 0
    assert all(isinstance(c, ConfigChange) for c in changes)

@pytest.mark.asyncio
async def test_config_rollback(config_manager, config_profiles):
    """Test config rollback"""
    # Apply configs in sequence
    for profile in config_profiles:
        await config_manager.apply_config(profile)

    # Rollback to first config
    success = await config_manager.rollback(config_profiles[0].id)
    assert success

    # Verify active config
    active = await config_manager.get_active_profile()
    assert active.id == config_profiles[0].id

@pytest.mark.asyncio
async def test_config_export_import(config_manager, config_profiles):
    """Test config export/import"""
    # Export config
    profile = config_profiles[0]
    export_data = await config_manager.export_config(profile)
    assert isinstance(export_data, dict)
    assert 'settings' in export_data
    assert 'metadata' in export_data

    # Import config
    imported = await config_manager.import_config(export_data)
    assert isinstance(imported, ConfigProfile)
    assert imported.settings == profile.settings

@pytest.mark.asyncio
async def test_config_dependencies(config_manager, config_profiles):
    """Test config dependency handling"""
    # Add dependency between profiles
    profile1 = config_profiles[0]
    profile2 = config_profiles[1]
    profile2.metadata['depends_on'] = profile1.id

    # Apply dependent config
    with pytest.raises(Exception):
        await config_manager.apply_config(profile2)  # Should fail without dependency

    # Apply base config first
    await config_manager.apply_config(profile1)
    success = await config_manager.apply_config(profile2)  # Should succeed
    assert success

@pytest.mark.asyncio
async def test_manager_start_stop(config_manager):
    """Test manager start/stop"""
    # Start manager
    await config_manager.start()
    assert config_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await config_manager.stop()
    assert not config_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(config_manager):
    """Test manager error handling"""
    # Mock validate_config to raise an exception
    async def mock_validate(*args):
        raise Exception("Test error")

    config_manager.validate_config = mock_validate

    # Start manager
    await config_manager.start()
    assert config_manager.active

    # Let it try to validate
    await asyncio.sleep(2)

    # Verify manager is still running
    assert config_manager.active

    # Stop manager
    await config_manager.stop()
    assert not config_manager.active

@pytest.mark.asyncio
async def test_config_notifications(config_manager, config_profiles):
    """Test config change notifications"""
    # Set up notification handler
    notifications = []
    def notification_handler(change):
        notifications.append(change)

    config_manager.on_config_change(notification_handler)

    # Apply config changes
    for profile in config_profiles:
        await config_manager.apply_config(profile)

    # Verify notifications
    assert len(notifications) == len(config_profiles)
    assert all(isinstance(n, ConfigChange) for n in notifications) 