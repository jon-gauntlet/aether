import asyncio
from dataclasses import dataclass, field
from datetime import datetime
import json
import logging
import os
from pathlib import Path
import sqlite3
from typing import Dict, List, Optional, Any, Set
import uuid

from systemd import journal

@dataclass
class Context:
    """A context representing a system state or behavior."""
    id: str
    timestamp: datetime
    context_type: str
    data: Dict[str, Any]
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ContextConfig:
    """Configuration for context management."""
    max_contexts: int = 1000
    max_age_days: int = 30
    context_types: Set[str] = field(default_factory=lambda: {
        'code', 'workflow', 'integration', 'system', 'user'
    })
    db_path: Optional[str] = None

class ContextManager:
    """Manages system contexts for pattern learning and evolution."""
    
    def __init__(self, config: Optional[ContextConfig] = None):
        self.config = config or ContextConfig()
        if self.config.db_path is None:
            self.config.db_path = os.path.expanduser('~/.local/share/gauntlet/contexts.db')
            
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.config.db_path), exist_ok=True)
        
        self.log = logging.getLogger("context_manager")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        self._init_db()
    
    def _init_db(self) -> None:
        """Initialize the SQLite database."""
        with sqlite3.connect(self.config.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS contexts (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    context_type TEXT NOT NULL,
                    data TEXT NOT NULL,
                    metadata TEXT
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_context_type 
                ON contexts(context_type)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp
                ON contexts(timestamp)
            """)
    
    async def create_context(
        self,
        context_type: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Context:
        """Create a new context."""
        if context_type not in self.config.context_types:
            raise ValueError(f"Invalid context type: {context_type}")
            
        context = Context(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            context_type=context_type,
            data=data,
            metadata=metadata or {}
        )
        
        await self._store_context(context)
        self.log.info(f"Created context {context.id} of type {context_type}")
        
        return context
    
    async def get_context(self, context_id: str) -> Optional[Context]:
        """Get a specific context by ID."""
        with sqlite3.connect(self.config.db_path) as conn:
            cursor = conn.execute(
                "SELECT * FROM contexts WHERE id = ?",
                (context_id,)
            )
            row = cursor.fetchone()
            
        if not row:
            return None
            
        return Context(
            id=row[0],
            timestamp=datetime.fromisoformat(row[1]),
            context_type=row[2],
            data=json.loads(row[3]),
            metadata=json.loads(row[4]) if row[4] else {}
        )
    
    async def get_contexts(
        self,
        context_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> List[Context]:
        """Get contexts matching the specified criteria."""
        conditions = []
        params = []
        
        if context_type:
            conditions.append("context_type = ?")
            params.append(context_type)
            
        if start_time:
            conditions.append("timestamp >= ?")
            params.append(start_time.isoformat())
            
        if end_time:
            conditions.append("timestamp <= ?")
            params.append(end_time.isoformat())
            
        query = "SELECT * FROM contexts"
        if conditions:
            query += f" WHERE {' AND '.join(conditions)}"
            
        query += " ORDER BY timestamp DESC"
        
        if limit:
            query += f" LIMIT {limit}"
            
        with sqlite3.connect(self.config.db_path) as conn:
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
        return [
            Context(
                id=row[0],
                timestamp=datetime.fromisoformat(row[1]),
                context_type=row[2],
                data=json.loads(row[3]),
                metadata=json.loads(row[4]) if row[4] else {}
            )
            for row in rows
        ]
    
    async def update_context(
        self,
        context_id: str,
        data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Context]:
        """Update an existing context."""
        context = await self.get_context(context_id)
        if not context:
            return None
            
        if data:
            context.data.update(data)
        if metadata:
            context.metadata.update(metadata)
            
        context.metadata['updated'] = True
        context.metadata['update_timestamp'] = datetime.now().isoformat()
        
        await self._store_context(context)
        self.log.info(f"Updated context {context_id}")
        
        return context
    
    async def delete_context(self, context_id: str) -> bool:
        """Delete a context."""
        with sqlite3.connect(self.config.db_path) as conn:
            cursor = conn.execute(
                "DELETE FROM contexts WHERE id = ?",
                (context_id,)
            )
            success = cursor.rowcount > 0
            
        if success:
            self.log.info(f"Deleted context {context_id}")
            
        return success
    
    async def cleanup_contexts(self) -> int:
        """Clean up old contexts."""
        with sqlite3.connect(self.config.db_path) as conn:
            # Delete old contexts
            if self.config.max_age_days:
                cursor = conn.execute(
                    f"DELETE FROM contexts WHERE timestamp < datetime('now', '-{self.config.max_age_days} days')"
                )
                deleted_count = cursor.rowcount
                
            # Limit total number of contexts
            if self.config.max_contexts:
                cursor = conn.execute(
                    """
                    DELETE FROM contexts 
                    WHERE id IN (
                        SELECT id FROM contexts
                        ORDER BY timestamp DESC
                        LIMIT -1 OFFSET ?
                    )
                    """,
                    (self.config.max_contexts,)
                )
                deleted_count += cursor.rowcount
                
        if deleted_count:
            self.log.info(f"Cleaned up {deleted_count} contexts")
            
        return deleted_count
    
    async def get_context_stats(self) -> Dict[str, Any]:
        """Get statistics about stored contexts."""
        with sqlite3.connect(self.config.db_path) as conn:
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_count,
                    MIN(timestamp) as oldest,
                    MAX(timestamp) as newest
                FROM contexts
            """)
            row = cursor.fetchone()
            
            cursor = conn.execute("""
                SELECT 
                    context_type,
                    COUNT(*) as count
                FROM contexts
                GROUP BY context_type
            """)
            type_stats = {
                row[0]: row[1]
                for row in cursor.fetchall()
            }
            
        return {
            'total_count': row[0],
            'oldest_context': datetime.fromisoformat(row[1]) if row[1] else None,
            'newest_context': datetime.fromisoformat(row[2]) if row[2] else None,
            'context_types': type_stats
        }
    
    async def _store_context(self, context: Context) -> None:
        """Store a context in the database."""
        with sqlite3.connect(self.config.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO contexts
                (id, timestamp, context_type, data, metadata)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    context.id,
                    context.timestamp.isoformat(),
                    context.context_type,
                    json.dumps(context.data),
                    json.dumps(context.metadata)
                )
            )