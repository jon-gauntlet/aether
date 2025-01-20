from typing import Dict, Any, Optional, List, Callable, Awaitable
from datetime import datetime
import logging
from dataclasses import dataclass
from enum import Enum
import asyncio

class CommandType(Enum):
    """Types of system commands"""
    ADMIN = "admin"
    DEBUG = "debug"
    BROADCAST = "broadcast"
    MAINTENANCE = "maintenance"

@dataclass
class CommandConfig:
    """Configuration for system commands"""
    name: str
    type: CommandType
    description: str
    required_permissions: set
    parameters: Dict[str, Dict[str, Any]] = None
    enabled: bool = True

class Command:
    """Represents a system command"""
    def __init__(self, config: CommandConfig, handler: Callable[..., Awaitable[Dict[str, Any]]]):
        self.config = config
        self.handler = handler
        self.logger = logging.getLogger(__name__)

    async def execute(self, user_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the command"""
        try:
            return await self.handler(user_id=user_id, **params)
        except Exception as e:
            self.logger.error(f"Error executing command {self.config.name}: {e}")
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }

class CommandManager:
    """Manages system commands"""
    def __init__(self):
        self.commands: Dict[str, Command] = {}
        self.logger = logging.getLogger(__name__)
        self._register_default_commands()

    def register_command(self, config: CommandConfig, handler: Callable[..., Awaitable[Dict[str, Any]]]):
        """Register a new command"""
        if config.name in self.commands:
            raise ValueError(f"Command {config.name} already exists")
        
        self.commands[config.name] = Command(config, handler)
        self.logger.info(f"Registered command: {config.name}")

    async def execute_command(self, name: str, user_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command by name"""
        command = self.commands.get(name)
        if not command:
            return {
                "status": "error",
                "message": f"Unknown command: {name}",
                "timestamp": datetime.now().isoformat()
            }

        if not command.config.enabled:
            return {
                "status": "error",
                "message": f"Command {name} is disabled",
                "timestamp": datetime.now().isoformat()
            }

        return await command.execute(user_id, params)

    def _register_default_commands(self):
        """Register default system commands"""
        # System status command
        self.register_command(
            CommandConfig(
                name="status",
                type=CommandType.DEBUG,
                description="Get system status",
                required_permissions={"view_status"}
            ),
            self._handle_status
        )

        # Broadcast message command
        self.register_command(
            CommandConfig(
                name="broadcast",
                type=CommandType.BROADCAST,
                description="Broadcast a message to all users",
                required_permissions={"broadcast"},
                parameters={
                    "message": {
                        "type": "string",
                        "required": True
                    },
                    "channel": {
                        "type": "string",
                        "required": False
                    }
                }
            ),
            self._handle_broadcast
        )

        # Maintenance mode command
        self.register_command(
            CommandConfig(
                name="maintenance",
                type=CommandType.MAINTENANCE,
                description="Enable/disable maintenance mode",
                required_permissions={"manage_system"},
                parameters={
                    "enabled": {
                        "type": "boolean",
                        "required": True
                    },
                    "message": {
                        "type": "string",
                        "required": False
                    }
                }
            ),
            self._handle_maintenance
        )

        # Debug info command
        self.register_command(
            CommandConfig(
                name="debug",
                type=CommandType.DEBUG,
                description="Get debug information",
                required_permissions={"debug"},
                parameters={
                    "component": {
                        "type": "string",
                        "required": False
                    }
                }
            ),
            self._handle_debug
        )

    async def _handle_status(self, user_id: str) -> Dict[str, Any]:
        """Handle status command"""
        return {
            "status": "success",
            "data": {
                "uptime": "TODO",
                "active_connections": 0,
                "message_rate": 0,
                "system_health": "healthy"
            },
            "timestamp": datetime.now().isoformat()
        }

    async def _handle_broadcast(self, user_id: str, message: str, channel: Optional[str] = None) -> Dict[str, Any]:
        """Handle broadcast command"""
        return {
            "status": "success",
            "data": {
                "message": message,
                "channel": channel,
                "broadcast_time": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }

    async def _handle_maintenance(self, user_id: str, enabled: bool, message: Optional[str] = None) -> Dict[str, Any]:
        """Handle maintenance mode command"""
        return {
            "status": "success",
            "data": {
                "maintenance_mode": enabled,
                "message": message,
                "set_by": user_id,
                "set_at": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }

    async def _handle_debug(self, user_id: str, component: Optional[str] = None) -> Dict[str, Any]:
        """Handle debug command"""
        return {
            "status": "success",
            "data": {
                "component": component or "all",
                "debug_info": {
                    "memory_usage": "TODO",
                    "cpu_usage": "TODO",
                    "thread_count": "TODO",
                    "open_connections": "TODO"
                }
            },
            "timestamp": datetime.now().isoformat()
        } 