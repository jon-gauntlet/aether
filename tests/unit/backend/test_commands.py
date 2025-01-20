import pytest
from datetime import datetime
from websocket.commands import CommandType, CommandConfig, Command, CommandManager

@pytest.fixture
def command_manager():
    return CommandManager()

async def mock_command_handler(user_id: str, **params):
    return {
        "status": "success",
        "data": {
            "user_id": user_id,
            "params": params
        },
        "timestamp": datetime.now().isoformat()
    }

async def mock_error_handler(user_id: str, **params):
    raise ValueError("Test error")

def test_command_type_values():
    assert CommandType.ADMIN.value == "admin"
    assert CommandType.DEBUG.value == "debug"
    assert CommandType.BROADCAST.value == "broadcast"
    assert CommandType.MAINTENANCE.value == "maintenance"

def test_command_config():
    config = CommandConfig(
        name="test",
        type=CommandType.ADMIN,
        description="Test command",
        required_permissions={"admin"},
        parameters={
            "param1": {
                "type": "string",
                "required": True
            }
        }
    )
    
    assert config.name == "test"
    assert config.type == CommandType.ADMIN
    assert config.description == "Test command"
    assert config.required_permissions == {"admin"}
    assert config.enabled is True

@pytest.mark.asyncio
async def test_command_execution():
    config = CommandConfig(
        name="test",
        type=CommandType.ADMIN,
        description="Test command",
        required_permissions={"admin"}
    )
    command = Command(config, mock_command_handler)
    
    result = await command.execute("test_user", {"param": "value"})
    assert result["status"] == "success"
    assert result["data"]["user_id"] == "test_user"
    assert result["data"]["params"]["param"] == "value"

@pytest.mark.asyncio
async def test_command_error_handling():
    config = CommandConfig(
        name="test",
        type=CommandType.ADMIN,
        description="Test command",
        required_permissions={"admin"}
    )
    command = Command(config, mock_error_handler)
    
    result = await command.execute("test_user", {})
    assert result["status"] == "error"
    assert "Test error" in result["message"]

def test_command_manager_registration(command_manager):
    # Test successful registration
    config = CommandConfig(
        name="test",
        type=CommandType.ADMIN,
        description="Test command",
        required_permissions={"admin"}
    )
    command_manager.register_command(config, mock_command_handler)
    assert "test" in command_manager.commands

    # Test duplicate registration
    with pytest.raises(ValueError):
        command_manager.register_command(config, mock_command_handler)

@pytest.mark.asyncio
async def test_command_manager_execution(command_manager):
    # Test successful execution
    config = CommandConfig(
        name="test",
        type=CommandType.ADMIN,
        description="Test command",
        required_permissions={"admin"}
    )
    command_manager.register_command(config, mock_command_handler)
    
    result = await command_manager.execute_command("test", "test_user", {"param": "value"})
    assert result["status"] == "success"
    assert result["data"]["user_id"] == "test_user"
    assert result["data"]["params"]["param"] == "value"

    # Test unknown command
    result = await command_manager.execute_command("unknown", "test_user", {})
    assert result["status"] == "error"
    assert "Unknown command" in result["message"]

@pytest.mark.asyncio
async def test_disabled_command(command_manager):
    config = CommandConfig(
        name="test",
        type=CommandType.ADMIN,
        description="Test command",
        required_permissions={"admin"},
        enabled=False
    )
    command_manager.register_command(config, mock_command_handler)
    
    result = await command_manager.execute_command("test", "test_user", {})
    assert result["status"] == "error"
    assert "disabled" in result["message"]

@pytest.mark.asyncio
async def test_default_commands(command_manager):
    # Test status command
    result = await command_manager.execute_command("status", "test_user", {})
    assert result["status"] == "success"
    assert "uptime" in result["data"]
    assert "active_connections" in result["data"]

    # Test broadcast command
    result = await command_manager.execute_command(
        "broadcast",
        "test_user",
        {"message": "Test broadcast"}
    )
    assert result["status"] == "success"
    assert result["data"]["message"] == "Test broadcast"

    # Test maintenance command
    result = await command_manager.execute_command(
        "maintenance",
        "test_user",
        {"enabled": True, "message": "Maintenance mode"}
    )
    assert result["status"] == "success"
    assert result["data"]["maintenance_mode"] is True
    assert result["data"]["message"] == "Maintenance mode"

    # Test debug command
    result = await command_manager.execute_command(
        "debug",
        "test_user",
        {"component": "test"}
    )
    assert result["status"] == "success"
    assert result["data"]["component"] == "test"
    assert "debug_info" in result["data"]

@pytest.mark.asyncio
async def test_command_parameter_validation(command_manager):
    # Test missing required parameter
    result = await command_manager.execute_command(
        "broadcast",
        "test_user",
        {}  # Missing required 'message' parameter
    )
    assert result["status"] == "error"

    # Test invalid parameter type
    result = await command_manager.execute_command(
        "maintenance",
        "test_user",
        {"enabled": "not_a_boolean"}  # Should be boolean
    )
    assert result["status"] == "error"

@pytest.mark.asyncio
async def test_custom_command_registration(command_manager):
    async def custom_handler(user_id: str, value: int):
        return {
            "status": "success",
            "data": {"result": value * 2},
            "timestamp": datetime.now().isoformat()
        }

    config = CommandConfig(
        name="multiply",
        type=CommandType.DEBUG,
        description="Multiply value by 2",
        required_permissions={"debug"},
        parameters={
            "value": {
                "type": "int",
                "required": True
            }
        }
    )
    command_manager.register_command(config, custom_handler)
    
    result = await command_manager.execute_command(
        "multiply",
        "test_user",
        {"value": 5}
    )
    assert result["status"] == "success"
    assert result["data"]["result"] == 10 