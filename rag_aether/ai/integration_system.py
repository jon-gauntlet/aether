"""Integration system for external data sources and services."""

from typing import Any, Dict, List, Optional, Union
import asyncio
import json
import logging
from pathlib import Path
import time
from urllib.parse import urlparse

import aiohttp
import requests

from ..errors import IntegrationError

logger = logging.getLogger(__name__)

class DataSourceConfig:
    """Configuration for a data source."""
    
    def __init__(self,
                 name: str,
                 source_type: str,
                 connection_params: Dict[str, Any],
                 polling_interval: Optional[int] = None):
        self.name = name
        self.source_type = source_type
        self.connection_params = connection_params
        self.polling_interval = polling_interval
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DataSourceConfig':
        """Create a config from a dictionary."""
        return cls(
            name=data['name'],
            source_type=data['source_type'],
            connection_params=data['connection_params'],
            polling_interval=data.get('polling_interval')
        )
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to a dictionary."""
        return {
            'name': self.name,
            'source_type': self.source_type,
            'connection_params': self.connection_params,
            'polling_interval': self.polling_interval
        }

class DataSourceManager:
    """Manages connections to external data sources."""
    
    def __init__(self):
        self.sources: Dict[str, DataSourceConfig] = {}
        self.active_connections: Dict[str, Any] = {}
        self._polling_tasks: Dict[str, asyncio.Task] = {}
        
    def add_source(self, config: DataSourceConfig) -> None:
        """Add a new data source configuration."""
        self.sources[config.name] = config
        
    def remove_source(self, name: str) -> None:
        """Remove a data source configuration."""
        if name in self.sources:
            del self.sources[name]
        if name in self.active_connections:
            del self.active_connections[name]
            
    async def connect(self, name: str) -> Any:
        """Establish connection to a data source."""
        if name not in self.sources:
            raise IntegrationError(f"Unknown data source: {name}")
            
        config = self.sources[name]
        
        try:
            if config.source_type == 'rest_api':
                session = aiohttp.ClientSession()
                self.active_connections[name] = session
                return session
                
            elif config.source_type == 'database':
                # Add database connection logic here
                pass
                
            else:
                raise IntegrationError(f"Unsupported source type: {config.source_type}")
                
        except Exception as e:
            raise IntegrationError(f"Failed to connect to {name}: {e}")
            
    async def disconnect(self, name: str) -> None:
        """Close connection to a data source."""
        if name in self.active_connections:
            conn = self.active_connections[name]
            if isinstance(conn, aiohttp.ClientSession):
                await conn.close()
            del self.active_connections[name]
            
    async def start_polling(self, name: str, callback: callable) -> None:
        """Start polling a data source periodically."""
        if name not in self.sources:
            raise IntegrationError(f"Unknown data source: {name}")
            
        config = self.sources[name]
        if not config.polling_interval:
            raise IntegrationError(f"No polling interval configured for {name}")
            
        async def _poll():
            while True:
                try:
                    data = await self.fetch_data(name)
                    await callback(data)
                except Exception as e:
                    logger.error(f"Polling error for {name}: {e}")
                await asyncio.sleep(config.polling_interval)
                
        self._polling_tasks[name] = asyncio.create_task(_poll())
        
    def stop_polling(self, name: str) -> None:
        """Stop polling a data source."""
        if name in self._polling_tasks:
            self._polling_tasks[name].cancel()
            del self._polling_tasks[name]
            
    async def fetch_data(self, name: str) -> Any:
        """Fetch data from a source."""
        if name not in self.sources:
            raise IntegrationError(f"Unknown data source: {name}")
            
        config = self.sources[name]
        
        try:
            if config.source_type == 'rest_api':
                if name not in self.active_connections:
                    await self.connect(name)
                    
                session = self.active_connections[name]
                url = config.connection_params['url']
                headers = config.connection_params.get('headers', {})
                
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    return await response.json()
                    
            elif config.source_type == 'database':
                # Add database fetch logic here
                pass
                
            else:
                raise IntegrationError(f"Unsupported source type: {config.source_type}")
                
        except Exception as e:
            raise IntegrationError(f"Failed to fetch data from {name}: {e}")
            
    async def push_data(self, name: str, data: Any) -> None:
        """Push data to a source."""
        if name not in self.sources:
            raise IntegrationError(f"Unknown data source: {name}")
            
        config = self.sources[name]
        
        try:
            if config.source_type == 'rest_api':
                if name not in self.active_connections:
                    await self.connect(name)
                    
                session = self.active_connections[name]
                url = config.connection_params['url']
                headers = config.connection_params.get('headers', {})
                
                async with session.post(url, json=data, headers=headers) as response:
                    response.raise_for_status()
                    
            elif config.source_type == 'database':
                # Add database push logic here
                pass
                
            else:
                raise IntegrationError(f"Unsupported source type: {config.source_type}")
                
        except Exception as e:
            raise IntegrationError(f"Failed to push data to {name}: {e}")
            
    async def close_all(self) -> None:
        """Close all active connections."""
        for name in list(self.active_connections.keys()):
            await self.disconnect(name)
        for name in list(self._polling_tasks.keys()):
            self.stop_polling(name) 