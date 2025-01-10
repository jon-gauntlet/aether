import pytest
import asyncio
import networkx as nx
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.dependencies import (
    DependencyManager,
    DependencyStore,
    Dependency,
    DependencyGraph,
    DependencyConfig,
    CircularDependencyError
)

@pytest.fixture
def dependency_store(tmp_path):
    """Create dependency store instance with temporary storage"""
    store = DependencyStore()
    store.storage_path = str(tmp_path / "dependencies")
    store._init_storage()
    return store

@pytest.fixture
def dependency_manager(dependency_store):
    """Create dependency manager instance"""
    config = DependencyConfig(
        check_interval=300.0,  # 5 minutes
        max_depth=10,
        enable_validation=True,
        enable_caching=True
    )
    manager = DependencyManager(config)
    manager.store = dependency_store
    return manager

@pytest.fixture
def dependencies():
    """Create test dependencies"""
    now = datetime.now()
    return [
        Dependency(
            id="test_dep_001",
            name="monitor",
            version="1.0.0",
            type="component",
            requires=[],
            provides=['metrics', 'health_status'],
            metadata={
                'priority': 1,
                'startup_order': 1
            },
            created_at=now,
            updated_at=now
        ),
        Dependency(
            id="test_dep_002",
            name="analyzer",
            version="1.0.0",
            type="component",
            requires=['metrics'],
            provides=['analysis_results'],
            metadata={
                'priority': 2,
                'startup_order': 2
            },
            created_at=now,
            updated_at=now
        ),
        Dependency(
            id="test_dep_003",
            name="planner",
            version="1.0.0",
            type="component",
            requires=['analysis_results'],
            provides=['action_plans'],
            metadata={
                'priority': 3,
                'startup_order': 3
            },
            created_at=now,
            updated_at=now
        ),
        Dependency(
            id="test_dep_004",
            name="executor",
            version="1.0.0",
            type="component",
            requires=['action_plans'],
            provides=['execution_results'],
            metadata={
                'priority': 4,
                'startup_order': 4
            },
            created_at=now,
            updated_at=now
        )
    ]

@pytest.mark.asyncio
async def test_store_dependency(dependency_store, dependencies):
    """Test dependency storage"""
    # Store dependencies
    for dep in dependencies:
        success = await dependency_store.store(dep)
        assert success

    # Retrieve dependencies
    for dep in dependencies:
        retrieved = await dependency_store.get(dep.id)
        assert retrieved is not None
        assert retrieved.id == dep.id
        assert retrieved.name == dep.name
        assert retrieved.requires == dep.requires
        assert retrieved.provides == dep.provides

@pytest.mark.asyncio
async def test_dependency_graph_creation(dependency_manager, dependencies):
    """Test dependency graph creation"""
    # Add dependencies
    for dep in dependencies:
        await dependency_manager.add_dependency(dep)

    # Build graph
    graph = await dependency_manager.build_graph()
    assert isinstance(graph, DependencyGraph)
    assert len(graph.nodes) == len(dependencies)
    assert all(dep.name in graph.nodes for dep in dependencies)

@pytest.mark.asyncio
async def test_dependency_resolution(dependency_manager, dependencies):
    """Test dependency resolution"""
    # Add dependencies
    for dep in dependencies:
        await dependency_manager.add_dependency(dep)

    # Resolve dependencies for executor
    resolved = await dependency_manager.resolve_dependencies("executor")
    assert len(resolved) == 4  # All components needed
    assert resolved[0].name == "monitor"  # Should start with root dependency

@pytest.mark.asyncio
async def test_circular_dependency_detection(dependency_manager):
    """Test circular dependency detection"""
    # Create circular dependencies
    circular_deps = [
        Dependency(
            id="circular_1",
            name="component_a",
            version="1.0.0",
            requires=['service_b'],
            provides=['service_a']
        ),
        Dependency(
            id="circular_2",
            name="component_b",
            version="1.0.0",
            requires=['service_a'],
            provides=['service_b']
        )
    ]

    # Add dependencies
    for dep in circular_deps:
        await dependency_manager.add_dependency(dep)

    # Attempt to build graph (should raise error)
    with pytest.raises(CircularDependencyError):
        await dependency_manager.build_graph()

@pytest.mark.asyncio
async def test_dependency_validation(dependency_manager, dependencies):
    """Test dependency validation"""
    # Valid dependency
    valid_dep = dependencies[0]
    is_valid = await dependency_manager.validate_dependency(valid_dep)
    assert is_valid

    # Invalid dependency (missing required fields)
    invalid_dep = dependencies[0].copy()
    invalid_dep.provides = []
    is_valid = await dependency_manager.validate_dependency(invalid_dep)
    assert not is_valid

@pytest.mark.asyncio
async def test_dependency_updates(dependency_manager, dependencies):
    """Test dependency updates"""
    # Add initial dependency
    dep = dependencies[0]
    await dependency_manager.add_dependency(dep)

    # Update dependency
    dep.version = "1.1.0"
    dep.requires.append('new_requirement')
    success = await dependency_manager.update_dependency(dep)
    assert success

    # Verify update
    updated = await dependency_manager.get_dependency(dep.id)
    assert updated.version == "1.1.0"
    assert 'new_requirement' in updated.requires

@pytest.mark.asyncio
async def test_dependency_removal(dependency_manager, dependencies):
    """Test dependency removal"""
    # Add dependencies
    for dep in dependencies:
        await dependency_manager.add_dependency(dep)

    # Remove dependency
    success = await dependency_manager.remove_dependency(dependencies[0].id)
    assert success

    # Verify removal
    removed = await dependency_manager.get_dependency(dependencies[0].id)
    assert removed is None

@pytest.mark.asyncio
async def test_dependency_search(dependency_manager, dependencies):
    """Test dependency searching"""
    # Add dependencies
    for dep in dependencies:
        await dependency_manager.add_dependency(dep)

    # Search by type
    results = await dependency_manager.search_dependencies(
        type="component",
        provides=['metrics']
    )
    assert len(results) == 1
    assert results[0].name == "monitor"

@pytest.mark.asyncio
async def test_dependency_version_management(dependency_manager):
    """Test dependency version management"""
    # Add multiple versions of same dependency
    versions = ["1.0.0", "1.1.0", "2.0.0"]
    for version in versions:
        dep = Dependency(
            id=f"test_dep_{version}",
            name="test_component",
            version=version,
            requires=[],
            provides=['test_service']
        )
        await dependency_manager.add_dependency(dep)

    # Get latest version
    latest = await dependency_manager.get_latest_version("test_component")
    assert latest.version == "2.0.0"

@pytest.mark.asyncio
async def test_dependency_graph_export(dependency_manager, dependencies):
    """Test dependency graph export"""
    # Add dependencies
    for dep in dependencies:
        await dependency_manager.add_dependency(dep)

    # Export graph
    graph_data = await dependency_manager.export_graph()
    assert isinstance(graph_data, dict)
    assert 'nodes' in graph_data
    assert 'edges' in graph_data
    assert len(graph_data['nodes']) == len(dependencies)

@pytest.mark.asyncio
async def test_manager_start_stop(dependency_manager):
    """Test manager start/stop"""
    # Start manager
    await dependency_manager.start()
    assert dependency_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await dependency_manager.stop()
    assert not dependency_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(dependency_manager):
    """Test manager error handling"""
    # Mock store.store to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    dependency_manager.store.store = mock_store

    # Start manager
    await dependency_manager.start()
    assert dependency_manager.active

    # Try to add dependency (should handle error gracefully)
    await dependency_manager.add_dependency(Dependency(
        id="test",
        name="test",
        version="1.0.0",
        requires=[],
        provides=[]
    ))

    # Verify manager is still running
    assert dependency_manager.active

    # Stop manager
    await dependency_manager.stop()
    assert not dependency_manager.active

@pytest.mark.asyncio
async def test_dependency_notifications(dependency_manager, dependencies):
    """Test dependency change notifications"""
    # Set up notification handler
    notifications = []
    def dependency_handler(dep_id, action):
        notifications.append((dep_id, action))

    # Enable notifications
    dependency_manager.on_dependency_change(dependency_handler)

    # Make changes
    for dep in dependencies:
        await dependency_manager.add_dependency(dep)
    
    await dependency_manager.remove_dependency(dependencies[0].id)

    # Verify notifications
    assert len(notifications) == len(dependencies) + 1  # adds + one remove
    assert any(action == 'remove' for _, action in notifications) 