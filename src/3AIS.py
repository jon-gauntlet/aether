import os
import json
import asyncio
import logging
import sqlite3
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from systemd import journal

@dataclass
class KnowledgeItem:
    id: str
    category: str
    subcategory: str
    content: Dict
    metadata: Dict
    created_at: datetime
    updated_at: datetime
    confidence: float
    source: str
    
class KnowledgeStore:
    def __init__(self):
        self.base_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
        self.db_path = os.path.join(self.base_path, 'knowledge.db')
        self.log = logging.getLogger("knowledge_store")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        # Initialize database
        self._init_db()
        
    def _init_db(self):
        """Initialize SQLite database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create knowledge table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS knowledge (
                    id TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    subcategory TEXT NOT NULL,
                    content TEXT NOT NULL,
                    metadata TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL,
                    confidence REAL NOT NULL,
                    source TEXT NOT NULL
                )
            """)
            
            # Create indices
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_category ON knowledge(category)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_subcategory ON knowledge(subcategory)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_confidence ON knowledge(confidence)")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.log.error(f"Failed to initialize database: {e}")
            raise
            
    async def store(self, item: KnowledgeItem) -> bool:
        """Store knowledge item"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Convert dictionaries to JSON
            content_json = json.dumps(item.content)
            metadata_json = json.dumps(item.metadata)
            
            # Insert or update item
            cursor.execute("""
                INSERT OR REPLACE INTO knowledge
                (id, category, subcategory, content, metadata,
                 created_at, updated_at, confidence, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item.id,
                item.category,
                item.subcategory,
                content_json,
                metadata_json,
                item.created_at.isoformat(),
                item.updated_at.isoformat(),
                item.confidence,
                item.source
            ))
            
            conn.commit()
            conn.close()
            
            self.log.info(f"Stored knowledge item {item.id}")
            return True
            
        except Exception as e:
            self.log.error(f"Failed to store knowledge item: {e}")
            return False
            
    async def get(self, item_id: str) -> Optional[KnowledgeItem]:
        """Get knowledge item by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, category, subcategory, content, metadata,
                       created_at, updated_at, confidence, source
                FROM knowledge
                WHERE id = ?
            """, (item_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return KnowledgeItem(
                    id=row[0],
                    category=row[1],
                    subcategory=row[2],
                    content=json.loads(row[3]),
                    metadata=json.loads(row[4]),
                    created_at=datetime.fromisoformat(row[5]),
                    updated_at=datetime.fromisoformat(row[6]),
                    confidence=row[7],
                    source=row[8]
                )
                
            return None
            
        except Exception as e:
            self.log.error(f"Failed to get knowledge item: {e}")
            return None
            
    async def search(
        self,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        min_confidence: float = 0.0,
        max_items: int = 100
    ) -> List[KnowledgeItem]:
        """Search knowledge items"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = """
                SELECT id, category, subcategory, content, metadata,
                       created_at, updated_at, confidence, source
                FROM knowledge
                WHERE confidence >= ?
            """
            params = [min_confidence]
            
            if category:
                query += " AND category = ?"
                params.append(category)
                
            if subcategory:
                query += " AND subcategory = ?"
                params.append(subcategory)
                
            query += " ORDER BY confidence DESC LIMIT ?"
            params.append(max_items)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            conn.close()
            
            return [
                KnowledgeItem(
                    id=row[0],
                    category=row[1],
                    subcategory=row[2],
                    content=json.loads(row[3]),
                    metadata=json.loads(row[4]),
                    created_at=datetime.fromisoformat(row[5]),
                    updated_at=datetime.fromisoformat(row[6]),
                    confidence=row[7],
                    source=row[8]
                )
                for row in rows
            ]
            
        except Exception as e:
            self.log.error(f"Failed to search knowledge items: {e}")
            return []
            
    async def delete(self, item_id: str) -> bool:
        """Delete knowledge item"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM knowledge WHERE id = ?", (item_id,))
            deleted = cursor.rowcount > 0
            
            conn.commit()
            conn.close()
            
            if deleted:
                self.log.info(f"Deleted knowledge item {item_id}")
                
            return deleted
            
        except Exception as e:
            self.log.error(f"Failed to delete knowledge item: {e}")
            return False
            
    async def cleanup(
        self,
        max_age: timedelta = timedelta(days=30),
        min_confidence: float = 0.5
    ) -> int:
        """Clean up old or low confidence items"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            min_date = (datetime.now() - max_age).isoformat()
            
            cursor.execute("""
                DELETE FROM knowledge
                WHERE updated_at < ? OR confidence < ?
            """, (min_date, min_confidence))
            
            deleted = cursor.rowcount
            
            conn.commit()
            conn.close()
            
            if deleted > 0:
                self.log.info(f"Cleaned up {deleted} knowledge items")
                
            return deleted
            
        except Exception as e:
            self.log.error(f"Failed to clean up knowledge items: {e}")
            return 0

class KnowledgeManager:
    def __init__(self):
        self.store = KnowledgeStore()
        self.log = logging.getLogger("knowledge_manager")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self.active = False
        
    async def start(self):
        """Start manager"""
        if self.active:
            return
            
        self.active = True
        self.log.info("Knowledge manager starting")
        
        # Start management tasks
        asyncio.create_task(self._manage_knowledge())
        
    async def stop(self):
        """Stop manager"""
        self.active = False
        self.log.info("Knowledge manager stopping")
        
    async def _manage_knowledge(self):
        """Manage knowledge base"""
        while self.active:
            try:
                # Clean up old items every day
                await self.store.cleanup()
                
                # Sleep before next cycle
                await asyncio.sleep(86400)  # 24 hours
                
            except Exception as e:
                self.log.error(f"Knowledge management error: {e}")
                await asyncio.sleep(3600)
                
    async def add_metric_pattern(
        self,
        metric_type: str,
        pattern_type: str,
        pattern_data: Dict,
        confidence: float,
        source: str
    ) -> bool:
        """Add metric pattern to knowledge base"""
        try:
            item = KnowledgeItem(
                id=f"pattern_{metric_type}_{datetime.now().isoformat()}",
                category="metrics",
                subcategory="patterns",
                content={
                    'metric_type': metric_type,
                    'pattern_type': pattern_type,
                    'pattern_data': pattern_data
                },
                metadata={
                    'detection_time': datetime.now().isoformat()
                },
                created_at=datetime.now(),
                updated_at=datetime.now(),
                confidence=confidence,
                source=source
            )
            
            return await self.store.store(item)
            
        except Exception as e:
            self.log.error(f"Failed to add metric pattern: {e}")
            return False
            
    async def add_optimization_result(
        self,
        action_type: str,
        parameters: Dict,
        result: str,
        success: bool,
        source: str
    ) -> bool:
        """Add optimization result to knowledge base"""
        try:
            item = KnowledgeItem(
                id=f"optimization_{action_type}_{datetime.now().isoformat()}",
                category="optimization",
                subcategory="results",
                content={
                    'action_type': action_type,
                    'parameters': parameters,
                    'result': result,
                    'success': success
                },
                metadata={
                    'execution_time': datetime.now().isoformat()
                },
                created_at=datetime.now(),
                updated_at=datetime.now(),
                confidence=1.0 if success else 0.0,
                source=source
            )
            
            return await self.store.store(item)
            
        except Exception as e:
            self.log.error(f"Failed to add optimization result: {e}")
            return False
            
    async def get_similar_patterns(
        self,
        metric_type: str,
        pattern_type: str,
        min_confidence: float = 0.5,
        max_items: int = 10
    ) -> List[KnowledgeItem]:
        """Get similar metric patterns"""
        try:
            return await self.store.search(
                category="metrics",
                subcategory="patterns",
                min_confidence=min_confidence,
                max_items=max_items
            )
            
        except Exception as e:
            self.log.error(f"Failed to get similar patterns: {e}")
            return []
            
    async def get_optimization_history(
        self,
        action_type: str,
        min_confidence: float = 0.0,
        max_items: int = 10
    ) -> List[KnowledgeItem]:
        """Get optimization history"""
        try:
            return await self.store.search(
                category="optimization",
                subcategory="results",
                min_confidence=min_confidence,
                max_items=max_items
            )
            
        except Exception as e:
            self.log.error(f"Failed to get optimization history: {e}")
            return []

async def main():
    """Main knowledge manager entry point"""
    manager = KnowledgeManager()
    
    try:
        await manager.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await manager.stop()
    except Exception as e:
        logger.error(f"Knowledge manager error: {e}")
        await manager.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 