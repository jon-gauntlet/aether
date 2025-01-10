import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.scheduling import (
    ScheduleManager,
    ScheduleStore,
    Schedule,
    Task,
    TaskResult,
    ScheduleConfig,
    TaskStatus,
    TaskPriority,
    ScheduleEvent
)

@pytest.fixture
def schedule_store(tmp_path):
    """Create schedule store instance with temporary storage"""
    store = ScheduleStore()
    store.storage_path = str(tmp_path / "schedules")
    store._init_storage()
    return store

@pytest.fixture
def schedule_manager(schedule_store):
    """Create schedule manager instance"""
    config = ScheduleConfig(
        check_interval=1.0,
        max_concurrent_tasks=5,
        task_timeout=timedelta(minutes=5),
        retry_limit=3,
        enable_task_recovery=True
    )
    manager = ScheduleManager(config)
    manager.store = schedule_store
    return manager

@pytest.fixture
def schedules():
    """Create test schedules"""
    now = datetime.now()
    return [
        Schedule(
            id="test_schedule_001",
            name="system_maintenance",
            tasks=[
                Task(
                    id="task_001",
                    name="cleanup_logs",
                    type="maintenance",
                    action={
                        'type': 'function',
                        'module': 'system.maintenance',
                        'function': 'cleanup_logs',
                        'args': {'max_age_days': 30}
                    },
                    schedule={
                        'type': 'interval',
                        'interval': timedelta(days=1),
                        'start_time': now.replace(hour=2, minute=0)
                    },
                    priority=TaskPriority.NORMAL,
                    retry_policy={
                        'max_attempts': 3,
                        'delay': timedelta(minutes=5)
                    },
                    dependencies=[],
                    status=TaskStatus.PENDING
                ),
                Task(
                    id="task_002",
                    name="optimize_database",
                    type="maintenance",
                    action={
                        'type': 'function',
                        'module': 'system.maintenance',
                        'function': 'optimize_database'
                    },
                    schedule={
                        'type': 'cron',
                        'expression': '0 3 * * 0'  # Every Sunday at 3 AM
                    },
                    priority=TaskPriority.HIGH,
                    retry_policy={
                        'max_attempts': 2,
                        'delay': timedelta(minutes=15)
                    },
                    dependencies=['task_001'],
                    status=TaskStatus.PENDING
                )
            ],
            metadata={
                'owner': 'system',
                'description': 'System maintenance tasks'
            },
            created_at=now,
            updated_at=now,
            active=True
        ),
        Schedule(
            id="test_schedule_002",
            name="data_processing",
            tasks=[
                Task(
                    id="task_003",
                    name="process_metrics",
                    type="processing",
                    action={
                        'type': 'function',
                        'module': 'data.processing',
                        'function': 'process_metrics'
                    },
                    schedule={
                        'type': 'interval',
                        'interval': timedelta(minutes=15)
                    },
                    priority=TaskPriority.HIGH,
                    retry_policy={
                        'max_attempts': 3,
                        'delay': timedelta(minutes=1)
                    },
                    dependencies=[],
                    status=TaskStatus.PENDING
                )
            ],
            metadata={
                'owner': 'system',
                'description': 'Data processing tasks'
            },
            created_at=now,
            updated_at=now,
            active=True
        )
    ]

@pytest.mark.asyncio
async def test_store_schedule(schedule_store, schedules):
    """Test schedule storage"""
    # Store schedules
    for schedule in schedules:
        success = await schedule_store.store(schedule)
        assert success

    # Retrieve schedules
    for schedule in schedules:
        retrieved = await schedule_store.get(schedule.id)
        assert retrieved is not None
        assert retrieved.id == schedule.id
        assert retrieved.name == schedule.name
        assert len(retrieved.tasks) == len(schedule.tasks)

@pytest.mark.asyncio
async def test_task_execution(schedule_manager):
    """Test task execution"""
    # Create test task
    task = Task(
        id="test_task",
        name="test_function",
        type="test",
        action={
            'type': 'function',
            'module': 'test',
            'function': 'test_function'
        },
        schedule={
            'type': 'immediate'
        },
        priority=TaskPriority.NORMAL,
        status=TaskStatus.PENDING
    )

    # Mock task execution
    async def mock_execute_task(*args):
        return TaskResult(
            task_id=task.id,
            success=True,
            result={'status': 'completed'}
        )

    with patch.object(schedule_manager, '_execute_task', mock_execute_task):
        # Execute task
        result = await schedule_manager.execute_task(task)
        assert result.success
        assert result.task_id == task.id

@pytest.mark.asyncio
async def test_schedule_validation(schedule_manager, schedules):
    """Test schedule validation"""
    # Valid schedule
    schedule = schedules[0]
    is_valid = await schedule_manager.validate_schedule(schedule)
    assert is_valid

    # Invalid schedule (circular dependencies)
    invalid_schedule = schedule.copy()
    invalid_schedule.tasks[0].dependencies = ['task_002']
    invalid_schedule.tasks[1].dependencies = ['task_001']
    
    is_valid = await schedule_manager.validate_schedule(invalid_schedule)
    assert not is_valid

@pytest.mark.asyncio
async def test_task_scheduling(schedule_manager, schedules):
    """Test task scheduling"""
    # Add schedule
    schedule = schedules[0]
    await schedule_manager.add_schedule(schedule)

    # Start scheduler
    await schedule_manager.start()

    # Let scheduler run briefly
    await asyncio.sleep(2)

    # Check task execution history
    history = await schedule_manager.get_task_history(schedule.tasks[0].id)
    assert len(history) > 0

    # Stop scheduler
    await schedule_manager.stop()

@pytest.mark.asyncio
async def test_task_dependencies(schedule_manager, schedules):
    """Test task dependency handling"""
    # Add schedule with dependent tasks
    schedule = schedules[0]
    await schedule_manager.add_schedule(schedule)

    # Get execution order
    order = await schedule_manager.get_execution_order(schedule.tasks)
    assert order.index('task_001') < order.index('task_002')

@pytest.mark.asyncio
async def test_task_retry(schedule_manager):
    """Test task retry handling"""
    # Create test task with retry policy
    task = Task(
        id="retry_task",
        name="failing_task",
        type="test",
        action={
            'type': 'function',
            'module': 'test',
            'function': 'failing_function'
        },
        schedule={'type': 'immediate'},
        retry_policy={
            'max_attempts': 3,
            'delay': timedelta(seconds=1)
        },
        status=TaskStatus.PENDING
    )

    # Mock failing task execution
    failure_count = 0
    async def mock_execute_task(*args):
        nonlocal failure_count
        failure_count += 1
        if failure_count < 3:
            return TaskResult(task_id=task.id, success=False, error="Test error")
        return TaskResult(task_id=task.id, success=True)

    with patch.object(schedule_manager, '_execute_task', mock_execute_task):
        # Execute task
        result = await schedule_manager.execute_task(task)
        assert result.success
        assert failure_count == 3

@pytest.mark.asyncio
async def test_schedule_monitoring(schedule_manager, schedules):
    """Test schedule monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    schedule_manager.on_schedule_event(event_handler)

    # Add and execute schedule
    schedule = schedules[0]
    await schedule_manager.add_schedule(schedule)
    await schedule_manager.execute_task(schedule.tasks[0])

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, ScheduleEvent) for e in events)

@pytest.mark.asyncio
async def test_task_prioritization(schedule_manager):
    """Test task prioritization"""
    # Create tasks with different priorities
    tasks = [
        Task(
            id=f"task_{i}",
            name=f"task_{i}",
            type="test",
            action={'type': 'function'},
            schedule={'type': 'immediate'},
            priority=priority,
            status=TaskStatus.PENDING
        )
        for i, priority in enumerate([
            TaskPriority.LOW,
            TaskPriority.NORMAL,
            TaskPriority.HIGH,
            TaskPriority.CRITICAL
        ])
    ]

    # Get execution order
    order = await schedule_manager.prioritize_tasks(tasks)
    priorities = [task.priority for task in order]
    assert priorities == sorted(priorities, reverse=True)

@pytest.mark.asyncio
async def test_schedule_persistence(schedule_manager, schedules):
    """Test schedule persistence"""
    # Store schedules
    for schedule in schedules:
        await schedule_manager.store.store(schedule)

    # Simulate manager restart
    await schedule_manager.stop()
    await schedule_manager.start()

    # Verify schedules were persisted
    for schedule in schedules:
        retrieved = await schedule_manager.get_schedule(schedule.id)
        assert retrieved is not None
        assert retrieved.id == schedule.id

@pytest.mark.asyncio
async def test_task_recovery(schedule_manager, schedules):
    """Test task recovery"""
    # Add schedule
    schedule = schedules[0]
    await schedule_manager.add_schedule(schedule)

    # Simulate task failure
    task = schedule.tasks[0]
    task.status = TaskStatus.FAILED
    await schedule_manager.update_task_status(task.id, TaskStatus.FAILED)

    # Enable recovery
    await schedule_manager.enable_task_recovery()

    # Let recovery run
    await asyncio.sleep(2)

    # Check task status
    updated_task = await schedule_manager.get_task(task.id)
    assert updated_task.status != TaskStatus.FAILED

@pytest.mark.asyncio
async def test_manager_start_stop(schedule_manager):
    """Test manager start/stop"""
    # Start manager
    await schedule_manager.start()
    assert schedule_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await schedule_manager.stop()
    assert not schedule_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(schedule_manager):
    """Test manager error handling"""
    # Mock store.store to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    schedule_manager.store.store = mock_store

    # Start manager
    await schedule_manager.start()
    assert schedule_manager.active

    # Try to add schedule (should handle error gracefully)
    await schedule_manager.add_schedule(schedules[0])

    # Verify manager is still running
    assert schedule_manager.active

    # Stop manager
    await schedule_manager.stop()
    assert not schedule_manager.active 