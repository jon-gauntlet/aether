import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
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

@dataclass
class Pattern:
    """A detected system behavior pattern."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    pattern_type: str
    confidence: float
    contexts: List[str]  # Context IDs that form this pattern
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

@dataclass
class PatternConfig:
    """Configuration for pattern detection."""
    min_confidence: float = 0.7
    min_contexts: int = 3
    max_pattern_age_days: int = 90
    similarity_threshold: float = 0.8

class ContextManager:
    """Manages system contexts for pattern learning and evolution."""
    
    def __init__(self, config: Optional[ContextConfig] = None):
        self.config = config or ContextConfig()
        self.pattern_config = PatternConfig()
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
                    timestamp TIMESTAMP,
                    context_type TEXT,
                    data JSON,
                    metadata JSON
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS patterns (
                    id TEXT PRIMARY KEY,
                    pattern_type TEXT,
                    confidence REAL,
                    contexts JSON,
                    metadata JSON,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """)
            
            conn.execute("CREATE INDEX IF NOT EXISTS idx_context_type ON contexts(context_type)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON contexts(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_pattern_type ON patterns(pattern_type)")
            
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
    
    async def detect_patterns(self, context_type: Optional[str] = None) -> List[Pattern]:
        """Detect patterns in recent contexts."""
        contexts = await self.get_contexts(
            context_type=context_type,
            start_time=datetime.now() - timedelta(days=self.pattern_config.max_pattern_age_days)
        )
        
        if len(contexts) < self.pattern_config.min_contexts:
            return []
            
        patterns = []
        context_groups = self._group_similar_contexts(contexts)
        
        for group in context_groups:
            if len(group) >= self.pattern_config.min_contexts:
                pattern = await self._create_pattern(group)
                if pattern.confidence >= self.pattern_config.min_confidence:
                    patterns.append(pattern)
                    await self._store_pattern(pattern)
                    
        return patterns
        
    def _group_similar_contexts(self, contexts: List[Context]) -> List[List[Context]]:
        """Group similar contexts together."""
        groups = []
        used_contexts = set()
        
        for context in contexts:
            if context.id in used_contexts:
                continue
                
            group = [context]
            used_contexts.add(context.id)
            
            for other in contexts:
                if other.id not in used_contexts and self._contexts_similar(context, other):
                    group.append(other)
                    used_contexts.add(other.id)
                    
            groups.append(group)
            
        return groups
        
    def _contexts_similar(self, c1: Context, c2: Context) -> bool:
        """Check if two contexts are similar enough to form a pattern."""
        if c1.context_type != c2.context_type:
            return False
            
        # Compare core attributes
        common_keys = set(c1.data.keys()) & set(c2.data.keys())
        if not common_keys:
            return False
            
        # Calculate similarity score
        matches = sum(1 for k in common_keys if c1.data[k] == c2.data[k])
        similarity = matches / len(common_keys)
        
        return similarity >= self.pattern_config.similarity_threshold
        
    async def _create_pattern(self, contexts: List[Context]) -> Pattern:
        """Create a pattern from a group of similar contexts."""
        pattern_type = contexts[0].context_type
        context_ids = [c.id for c in contexts]
        
        # Calculate confidence based on consistency and sample size
        consistency = self._calculate_pattern_consistency(contexts)
        sample_size_factor = min(1.0, len(contexts) / 10)  # Scales up to 10 samples
        confidence = consistency * sample_size_factor
        
        metadata = {
            'sample_size': len(contexts),
            'consistency': consistency,
            'common_attributes': self._get_common_attributes(contexts)
        }
        
        return Pattern(
            pattern_type=pattern_type,
            confidence=confidence,
            contexts=context_ids,
            metadata=metadata
        )
        
    def _calculate_pattern_consistency(self, contexts: List[Context]) -> float:
        """Calculate how consistent the pattern is across contexts."""
        if not contexts:
            return 0.0
            
        # Get all keys present in any context
        all_keys = set()
        for context in contexts:
            all_keys.update(context.data.keys())
            
        # Calculate consistency for each key
        consistencies = []
        for key in all_keys:
            values = [c.data.get(key) for c in contexts if key in c.data]
            if not values:
                continue
                
            # Calculate value frequency
            value_counts = {}
            for value in values:
                value_str = str(value)  # Convert to string for comparison
                value_counts[value_str] = value_counts.get(value_str, 0) + 1
                
            # Get frequency of most common value
            max_count = max(value_counts.values())
            consistency = max_count / len(values)
            consistencies.append(consistency)
            
        return sum(consistencies) / len(consistencies) if consistencies else 0.0
        
    def _get_common_attributes(self, contexts: List[Context]) -> Dict[str, Any]:
        """Get attributes that are common across all contexts."""
        if not contexts:
            return {}
            
        # Start with all keys from first context
        common_attrs = dict(contexts[0].data)
        
        # Remove keys that aren't consistent across all contexts
        for context in contexts[1:]:
            for key, value in list(common_attrs.items()):
                if key not in context.data or context.data[key] != value:
                    del common_attrs[key]
                    
        return common_attrs
        
    async def _store_pattern(self, pattern: Pattern) -> None:
        """Store a pattern in the database."""
        with sqlite3.connect(self.config.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO patterns
                (id, pattern_type, confidence, contexts, metadata, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    pattern.id,
                    pattern.pattern_type,
                    pattern.confidence,
                    json.dumps(pattern.contexts),
                    json.dumps(pattern.metadata),
                    pattern.created_at.isoformat(),
                    pattern.updated_at.isoformat()
                )
            )
            
    async def get_patterns(
        self,
        pattern_type: Optional[str] = None,
        min_confidence: Optional[float] = None,
        limit: Optional[int] = None
    ) -> List[Pattern]:
        """Retrieve stored patterns."""
        query = "SELECT * FROM patterns WHERE 1=1"
        params = []
        
        if pattern_type:
            query += " AND pattern_type = ?"
            params.append(pattern_type)
            
        if min_confidence:
            query += " AND confidence >= ?"
            params.append(min_confidence)
            
        query += " ORDER BY confidence DESC"
        
        if limit:
            query += " LIMIT ?"
            params.append(limit)
            
        patterns = []
        with sqlite3.connect(self.config.db_path) as conn:
            for row in conn.execute(query, params):
                pattern = Pattern(
                    id=row[0],
                    pattern_type=row[1],
                    confidence=row[2],
                    contexts=json.loads(row[3]),
                    metadata=json.loads(row[4]),
                    created_at=datetime.fromisoformat(row[5]),
                    updated_at=datetime.fromisoformat(row[6])
                )
                patterns.append(pattern)
                
        return patterns