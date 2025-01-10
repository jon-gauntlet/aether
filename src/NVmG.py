import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.versioning import (
    VersionManager,
    VersionStore,
    Version,
    VersionConfig,
    VersionStatus,
    ChangeSet,
    Migration,
    VersionEvent
)

@pytest.fixture
def version_store(tmp_path):
    """Create version store instance with temporary storage"""
    store = VersionStore()
    store.storage_path = str(tmp_path / "versions")
    store._init_storage()
    return store

@pytest.fixture
def version_manager(version_store):
    """Create version manager instance"""
    config = VersionConfig(
        check_interval=5.0,
        max_versions=100,
        auto_cleanup=True,
        enable_rollback=True,
        backup_path=str(tmp_path / "backups")
    )
    manager = VersionManager(config)
    manager.store = version_store
    return manager

@pytest.fixture
def versions():
    """Create test versions"""
    now = datetime.now()
    return [
        Version(
            id="test_version_001",
            number="1.0.0",
            timestamp=now - timedelta(days=i),
            changes=ChangeSet(
                additions=[
                    {
                        'type': 'feature',
                        'component': 'monitor',
                        'description': 'Added performance monitoring'
                    }
                ],
                modifications=[
                    {
                        'type': 'enhancement',
                        'component': 'analyzer',
                        'description': 'Improved analysis algorithms'
                    }
                ],
                removals=[
                    {
                        'type': 'cleanup',
                        'component': 'legacy',
                        'description': 'Removed deprecated features'
                    }
                ]
            ),
            migration=Migration(
                up_scripts=[
                    {
                        'type': 'sql',
                        'path': 'migrations/1.0.0/up.sql'
                    }
                ],
                down_scripts=[
                    {
                        'type': 'sql',
                        'path': 'migrations/1.0.0/down.sql'
                    }
                ],
                dependencies=[]
            ),
            metadata={
                'author': 'system',
                'release_notes': 'Initial release'
            },
            status=VersionStatus.ACTIVE,
            created_at=now - timedelta(days=i),
            updated_at=now - timedelta(days=i)
        )
        for i in range(3)
    ]

@pytest.mark.asyncio
async def test_store_version(version_store, versions):
    """Test version storage"""
    # Store versions
    for version in versions:
        success = await version_store.store(version)
        assert success

    # Retrieve versions
    for version in versions:
        retrieved = await version_store.get(version.id)
        assert retrieved is not None
        assert retrieved.id == version.id
        assert retrieved.number == version.number
        assert retrieved.status == version.status

@pytest.mark.asyncio
async def test_version_upgrade(version_manager, versions):
    """Test version upgrade"""
    # Mock migration execution
    async def mock_execute_migration(*args):
        return True

    with patch.object(version_manager, '_execute_migration', mock_execute_migration):
        # Upgrade to new version
        current_version = versions[1]
        new_version = versions[0]
        
        success = await version_manager.upgrade_version(
            current_version=current_version,
            target_version=new_version
        )
        assert success

        # Verify current version
        current = await version_manager.get_current_version()
        assert current.number == new_version.number

@pytest.mark.asyncio
async def test_version_rollback(version_manager, versions):
    """Test version rollback"""
    # Mock migration execution
    async def mock_execute_migration(*args):
        return True

    with patch.object(version_manager, '_execute_migration', mock_execute_migration):
        # Set current version
        current_version = versions[0]
        await version_manager.set_current_version(current_version)

        # Rollback to previous version
        previous_version = versions[1]
        success = await version_manager.rollback_version(
            target_version=previous_version
        )
        assert success

        # Verify current version
        current = await version_manager.get_current_version()
        assert current.number == previous_version.number

@pytest.mark.asyncio
async def test_version_validation(version_manager, versions):
    """Test version validation"""
    # Valid version
    version = versions[0]
    is_valid = await version_manager.validate_version(version)
    assert is_valid

    # Invalid version (missing required fields)
    invalid_version = version.copy()
    invalid_version.changes = None
    is_valid = await version_manager.validate_version(invalid_version)
    assert not is_valid

@pytest.mark.asyncio
async def test_migration_execution(version_manager):
    """Test migration execution"""
    # Create test migration
    migration = Migration(
        up_scripts=[
            {
                'type': 'python',
                'code': 'async def migrate(): return True'
            }
        ],
        down_scripts=[
            {
                'type': 'python',
                'code': 'async def rollback(): return True'
            }
        ]
    )

    # Execute migration
    success = await version_manager.execute_migration(
        migration,
        direction='up'
    )
    assert success

@pytest.mark.asyncio
async def test_version_dependencies(version_manager, versions):
    """Test version dependency handling"""
    # Add dependencies between versions
    versions[0].migration.dependencies = [versions[1].number]
    versions[1].migration.dependencies = [versions[2].number]

    # Get upgrade path
    path = await version_manager.get_upgrade_path(
        current_version=versions[2],
        target_version=versions[0]
    )
    
    assert len(path) == 3
    assert path[0].number == versions[2].number
    assert path[-1].number == versions[0].number

@pytest.mark.asyncio
async def test_version_conflict_detection(version_manager, versions):
    """Test version conflict detection"""
    # Create conflicting versions
    version1 = versions[0].copy()
    version2 = versions[0].copy()
    version2.number = "1.0.1"

    version1.changes.modifications = [
        {
            'type': 'update',
            'component': 'shared',
            'file': 'config.json'
        }
    ]
    version2.changes.modifications = [
        {
            'type': 'update',
            'component': 'shared',
            'file': 'config.json'
        }
    ]

    # Check for conflicts
    conflicts = await version_manager.check_conflicts(version1, version2)
    assert len(conflicts) > 0

@pytest.mark.asyncio
async def test_version_backup(version_manager, versions):
    """Test version backup"""
    # Create backup
    version = versions[0]
    backup_path = await version_manager.create_backup(version)
    assert backup_path is not None

    # Restore from backup
    success = await version_manager.restore_backup(backup_path)
    assert success

@pytest.mark.asyncio
async def test_version_monitoring(version_manager, versions):
    """Test version monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    version_manager.on_version_event(event_handler)

    # Perform version change
    await version_manager.set_current_version(versions[0])

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, VersionEvent) for e in events)

@pytest.mark.asyncio
async def test_version_cleanup(version_manager, versions):
    """Test version cleanup"""
    # Store versions
    for version in versions:
        await version_manager.store.store(version)

    # Add old version
    old_version = versions[0].copy()
    old_version.id = "old_version"
    old_version.created_at = datetime.now() - timedelta(days=60)
    await version_manager.store.store(old_version)

    # Run cleanup
    cleaned = await version_manager.cleanup(max_age=timedelta(days=30))
    assert cleaned > 0

@pytest.mark.asyncio
async def test_version_export_import(version_manager, versions):
    """Test version export/import"""
    # Export version
    version = versions[0]
    export_data = await version_manager.export_version(version)
    assert isinstance(export_data, dict)
    assert 'number' in export_data
    assert 'changes' in export_data

    # Import version
    imported = await version_manager.import_version(export_data)
    assert isinstance(imported, Version)
    assert imported.number == version.number

@pytest.mark.asyncio
async def test_manager_start_stop(version_manager):
    """Test manager start/stop"""
    # Start manager
    await version_manager.start()
    assert version_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await version_manager.stop()
    assert not version_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(version_manager):
    """Test manager error handling"""
    # Mock store.store to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    version_manager.store.store = mock_store

    # Start manager
    await version_manager.start()
    assert version_manager.active

    # Try to store version (should handle error gracefully)
    await version_manager.store_version(versions[0])

    # Verify manager is still running
    assert version_manager.active

    # Stop manager
    await version_manager.stop()
    assert not version_manager.active

@pytest.mark.asyncio
async def test_version_notifications(version_manager, versions):
    """Test version change notifications"""
    # Set up notification handler
    notifications = []
    def notification_handler(old_version, new_version):
        notifications.append((old_version, new_version))

    version_manager.on_version_change(notification_handler)

    # Change versions
    for version in versions:
        await version_manager.set_current_version(version)

    # Verify notifications
    assert len(notifications) == len(versions)
    assert all(isinstance(new, Version) for _, new in notifications) 