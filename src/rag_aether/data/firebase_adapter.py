from typing import List, Dict, Any, Optional, Callable, Awaitable
import os
import json
import logging
from dataclasses import dataclass
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

@dataclass
class Document:
    """A document with content and metadata."""
    page_content: str
    metadata: Dict[str, Any]

class FirebaseAdapter:
    def __init__(self, use_mock: bool = False):
        """Initialize Firebase connection."""
        if use_mock:
            logger.warning("Using mock Firebase adapter")
            self.mock_data = [
                Document(
                    page_content="The main technical requirements include optimizing memory usage, reducing context switching overhead, optimizing the real-time processing pipeline, and implementing predictive loading capabilities.",
                    metadata={
                        "id": "1",
                        "title": "Technical Requirements Discussion",
                        "participants": ["Alice", "Bob"],
                        "timestamp": "2024-03-01T12:00:00Z"
                    }
                ),
                Document(
                    page_content="The team discussed project deadlines but no specific dates were set. The focus was on ensuring quality and stability rather than rushing to meet arbitrary deadlines.",
                    metadata={
                        "id": "2",
                        "title": "Project Planning",
                        "participants": ["Charlie", "Diana"],
                        "timestamp": "2024-03-02T14:30:00Z"
                    }
                )
            ]
            return

        try:
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
            if not cred_path or not os.path.exists(cred_path):
                logger.warning("Firebase credentials not found, using mock data")
                self.mock_data = [
                    Document(
                        page_content="The main technical requirements include optimizing memory usage, reducing context switching overhead, optimizing the real-time processing pipeline, and implementing predictive loading capabilities.",
                        metadata={
                            "id": "1",
                            "title": "Technical Requirements Discussion",
                            "participants": ["Alice", "Bob"],
                            "timestamp": "2024-03-01T12:00:00Z"
                        }
                    ),
                    Document(
                        page_content="The team discussed project deadlines but no specific dates were set. The focus was on ensuring quality and stability rather than rushing to meet arbitrary deadlines.",
                        metadata={
                            "id": "2",
                            "title": "Project Planning",
                            "participants": ["Charlie", "Diana"],
                            "timestamp": "2024-03-02T14:30:00Z"
                        }
                    )
                ]
                return

            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            self.conversations_ref = self.db.collection("conversations")
            logger.info("Firebase adapter initialized")
            
        except Exception as e:
            logger.warning(f"Failed to initialize Firebase: {str(e)}, using mock data")
            self.mock_data = [
                Document(
                    page_content="The main technical requirements include optimizing memory usage, reducing context switching overhead, optimizing the real-time processing pipeline, and implementing predictive loading capabilities.",
                    metadata={
                        "id": "1",
                        "title": "Technical Requirements Discussion",
                        "participants": ["Alice", "Bob"],
                        "timestamp": "2024-03-01T12:00:00Z"
                    }
                ),
                Document(
                    page_content="The team discussed project deadlines but no specific dates were set. The focus was on ensuring quality and stability rather than rushing to meet arbitrary deadlines.",
                    metadata={
                        "id": "2",
                        "title": "Project Planning",
                        "participants": ["Charlie", "Diana"],
                        "timestamp": "2024-03-02T14:30:00Z"
                    }
                )
            ]

    async def get_conversations(self) -> List[Document]:
        """Get all conversations from Firebase."""
        if hasattr(self, 'mock_data'):
            logger.info("Using mock data")
            return self.mock_data

        docs = []
        try:
            # Get all conversations
            conversations = self.conversations_ref.stream()
            
            for conv in conversations:
                conv_data = conv.to_dict()
                # Create document with conversation content and metadata
                doc = Document(
                    page_content=conv_data.get("content", ""),
                    metadata={
                        "id": conv.id,
                        "title": conv_data.get("title", ""),
                        "participants": conv_data.get("participants", []),
                        "timestamp": conv_data.get("timestamp", None)
                    }
                )
                docs.append(doc)
                
            logger.info(f"Retrieved {len(docs)} conversations from Firebase")
            return docs
            
        except Exception as e:
            logger.error(f"Error retrieving conversations: {str(e)}")
            raise

    async def watch_conversations(self, callback: Callable[[Document], Awaitable[None]]):
        """Watch for changes in conversations."""
        if hasattr(self, 'mock_data'):
            logger.info("Watch not available in mock mode")
            return None

        try:
            # Create a callback wrapper that converts to our Document format
            async def on_snapshot(doc_snapshot, changes, read_time):
                for change in changes:
                    if change.type.name in ["ADDED", "MODIFIED"]:
                        conv_data = change.document.to_dict()
                        doc = Document(
                            page_content=conv_data.get("content", ""),
                            metadata={
                                "id": change.document.id,
                                "title": conv_data.get("title", ""),
                                "participants": conv_data.get("participants", []),
                                "timestamp": conv_data.get("timestamp", None)
                            }
                        )
                        await callback(doc)
            
            # Watch the collection
            return self.conversations_ref.on_snapshot(on_snapshot)
            
        except Exception as e:
            logger.error(f"Error setting up conversation watch: {str(e)}")
            raise 