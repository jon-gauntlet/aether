from typing import List, Dict, Any, Optional, Callable, Awaitable
import os
import json
import logging
from dataclasses import dataclass

load_dotenv = lambda: None  # Mock for now
logger = logging.getLogger(__name__)

@dataclass
class Document:
    """A document with content and metadata."""
    page_content: str
    metadata: Dict[str, Any]

class FirebaseAdapter:
    def __init__(self, use_mock: bool = True):
        """Initialize Firebase connection or mock data."""
        self.use_mock = use_mock
        self.mock_data = [
            Document(
                page_content="During flow states, users exhibit increased focus and productivity. The system metrics show 80% higher engagement and 60% fewer context switches.",
                metadata={
                    "id": "1",
                    "title": "Flow State Analysis",
                    "participants": ["Alice", "Bob"],
                    "timestamp": "2024-03-01T12:00:00Z",
                    "flow_state": "high"
                }
            ),
            Document(
                page_content="Performance patterns during flow states show reduced memory usage and faster response times. The real-time processing pipeline optimizations resulted in 40% better throughput.",
                metadata={
                    "id": "2", 
                    "title": "Performance Metrics",
                    "participants": ["Charlie", "Diana"],
                    "timestamp": "2024-03-02T14:30:00Z",
                    "flow_state": "optimal"
                }
            ),
            Document(
                page_content="User behavior analysis reveals that during flow states, developers make fewer errors and produce higher quality code. Code review acceptance rates increased by 35%.",
                metadata={
                    "id": "3",
                    "title": "Developer Productivity",
                    "participants": ["Eve", "Frank"],
                    "timestamp": "2024-03-03T09:15:00Z",
                    "flow_state": "peak"
                }
            )
        ]

        if not use_mock:
            logger.warning("Real Firebase not implemented yet, using mock data")
    
    def get_conversations(self) -> List[Document]:
        """Get all conversations."""
        return self.mock_data 