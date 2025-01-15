from firebase_admin import credentials, initialize_app, firestore
from typing import List, Dict, Any
from langchain_core.documents import Document
import json
import os
from pathlib import Path

class FirebaseAdapter:
    def __init__(self):
        try:
            # Use the service account file directly
            service_account_path = Path("firebase-service-account.json")
            if not service_account_path.exists():
                raise ValueError("Firebase service account file not found")
            
            # Initialize Firebase Admin with the service account file
            initialize_app(credentials.Certificate(str(service_account_path)))
            self.db = firestore.client()
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Firebase: {str(e)}")

    async def get_conversations(self) -> List[Document]:
        """Retrieve all conversations from Firestore and convert to Documents."""
        docs = []
        try:
            conversations_ref = self.db.collection('conversations')
            conversations = conversations_ref.get()

            for conv in conversations:
                conv_data = conv.to_dict()
                
                # Extract messages and format them
                messages = conv_data.get('messages', [])
                formatted_messages = []
                
                for msg in messages:
                    sender = msg.get('sender', '')
                    content = msg.get('content', '')
                    formatted_messages.append(f"{sender}: {content}")
                
                # Join messages with newlines
                conversation_text = "\n".join(formatted_messages)
                
                # Create Document with metadata
                doc = Document(
                    page_content=conversation_text,
                    metadata={
                        'conversation_id': conv.id,
                        'title': conv_data.get('title', ''),
                        'participants': conv_data.get('participants', []),
                        'context': conv_data.get('context', {}),
                    }
                )
                docs.append(doc)
            
            return docs
        except Exception as e:
            raise RuntimeError(f"Failed to fetch conversations: {str(e)}")

    async def watch_conversations(self, callback):
        """Watch for changes in conversations collection."""
        def on_snapshot(doc_snapshot, changes, read_time):
            for change in changes:
                if change.type.name in ['ADDED', 'MODIFIED']:
                    conv_data = change.document.to_dict()
                    messages = conv_data.get('messages', [])
                    formatted_messages = []
                    
                    for msg in messages:
                        sender = msg.get('sender', '')
                        content = msg.get('content', '')
                        formatted_messages.append(f"{sender}: {content}")
                    
                    conversation_text = "\n".join(formatted_messages)
                    
                    doc = Document(
                        page_content=conversation_text,
                        metadata={
                            'conversation_id': change.document.id,
                            'title': conv_data.get('title', ''),
                            'participants': conv_data.get('participants', []),
                            'context': conv_data.get('context', {}),
                        }
                    )
                    callback(doc)

        # Watch the conversations collection
        return self.db.collection('conversations').on_snapshot(on_snapshot) 