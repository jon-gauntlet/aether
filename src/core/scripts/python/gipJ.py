import asyncio
from datetime import datetime
import json
import os
from pathlib import Path
import sqlite3
from typing import Dict, List, Optional, Any
import uuid

from .learner import Pattern

class PatternStore:
    """Persistent storage for learned patterns."""
    
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = os.path.expanduser('~/.local/share/gauntlet/patterns.db')
            
        # Ensure directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self) -> None:
        """Initialize the SQLite database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS patterns (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    pattern_type TEXT NOT NULL,
                    data TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    source_contexts TEXT NOT NULL,
                    metadata TEXT
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_pattern_type 
                ON patterns(pattern_type)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_confidence
                ON patterns(confidence)
            """)
    
    async def store_pattern(self, pattern: Pattern) -> None:
        """Store a pattern in the database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO patterns
                (id, timestamp, pattern_type, data, confidence, source_contexts, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    pattern.id,
                    pattern.timestamp.isoformat(),
                    pattern.pattern_type,
                    json.dumps(pattern.data),
                    pattern.confidence,
                    json.dumps(pattern.source_contexts),
                    json.dumps(pattern.metadata)
                )
            )
    
    async def load_patterns(
        self,
        pattern_type: Optional[str] = None,
        min_confidence: float = 0.0,
        limit: Optional[int] = None
    ) -> List[Pattern]:
        """Load patterns from the database."""
        query = "SELECT * FROM patterns WHERE confidence >= ?"
        params = [min_confidence]
        
        if pattern_type:
            query += " AND pattern_type = ?"
            params.append(pattern_type)
            
        query += " ORDER BY confidence DESC"
        
        if limit:
            query += f" LIMIT {limit}"
            
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
        return [
            Pattern(
                id=row[0],
                timestamp=datetime.fromisoformat(row[1]),
                pattern_type=row[2],
                data=json.loads(row[3]),
                confidence=row[4],
                source_contexts=json.loads(row[5]),
                metadata=json.loads(row[6]) if row[6] else {}
            )
            for row in rows
        ]
    
    async def get_pattern(self, pattern_id: str) -> Optional[Pattern]:
        """Get a specific pattern by ID."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT * FROM patterns WHERE id = ?",
                (pattern_id,)
            )
            row = cursor.fetchone()
            
        if not row:
            return None
            
        return Pattern(
            id=row[0],
            timestamp=datetime.fromisoformat(row[1]),
            pattern_type=row[2],
            data=json.loads(row[3]),
            confidence=row[4],
            source_contexts=json.loads(row[5]),
            metadata=json.loads(row[6]) if row[6] else {}
        )
    
    async def delete_pattern(self, pattern_id: str) -> bool:
        """Delete a pattern from the database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "DELETE FROM patterns WHERE id = ?",
                (pattern_id,)
            )
            return cursor.rowcount > 0
    
    async def cleanup_patterns(
        self,
        min_confidence: float = 0.0,
        max_age_days: Optional[int] = None,
        max_patterns_per_type: Optional[int] = None
    ) -> int:
        """Clean up old or low confidence patterns."""
        conditions = ["confidence < ?"]
        params = [min_confidence]
        
        if max_age_days:
            conditions.append(
                f"timestamp < datetime('now', '-{max_age_days} days')"
            )
            
        query = f"DELETE FROM patterns WHERE {' OR '.join(conditions)}"
        
        with sqlite3.connect(self.db_path) as conn:
            # Delete old/low confidence patterns
            cursor = conn.execute(query, params)
            deleted_count = cursor.rowcount
            
            # Limit patterns per type if specified
            if max_patterns_per_type:
                cursor = conn.execute(
                    "SELECT DISTINCT pattern_type FROM patterns"
                )
                pattern_types = [row[0] for row in cursor.fetchall()]
                
                for pattern_type in pattern_types:
                    # Get patterns sorted by confidence
                    cursor = conn.execute(
                        """
                        SELECT id FROM patterns 
                        WHERE pattern_type = ?
                        ORDER BY confidence DESC
                        """,
                        (pattern_type,)
                    )
                    pattern_ids = [row[0] for row in cursor.fetchall()]
                    
                    # Delete excess patterns
                    if len(pattern_ids) > max_patterns_per_type:
                        to_delete = pattern_ids[max_patterns_per_type:]
                        placeholders = ','.join('?' * len(to_delete))
                        cursor = conn.execute(
                            f"DELETE FROM patterns WHERE id IN ({placeholders})",
                            to_delete
                        )
                        deleted_count += cursor.rowcount
                        
        return deleted_count
    
    async def get_pattern_stats(self) -> Dict[str, Any]:
        """Get statistics about stored patterns."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_count,
                    AVG(confidence) as avg_confidence,
                    MIN(timestamp) as oldest,
                    MAX(timestamp) as newest
                FROM patterns
            """)
            row = cursor.fetchone()
            
            cursor = conn.execute("""
                SELECT 
                    pattern_type,
                    COUNT(*) as count,
                    AVG(confidence) as avg_confidence
                FROM patterns
                GROUP BY pattern_type
            """)
            type_stats = {
                row[0]: {
                    'count': row[1],
                    'avg_confidence': row[2]
                }
                for row in cursor.fetchall()
            }
            
        return {
            'total_count': row[0],
            'avg_confidence': row[1],
            'oldest_pattern': datetime.fromisoformat(row[2]),
            'newest_pattern': datetime.fromisoformat(row[3]),
            'pattern_types': type_stats
        } 