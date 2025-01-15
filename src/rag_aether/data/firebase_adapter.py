from firebase_admin import credentials, initialize_app, firestore
from typing import List, Dict, Any
from langchain_core.documents import Document
import json
import os
from pathlib import Path

class FirebaseAdapter:
    def __init__(self):
        # Get the service account key from env
        service_account = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT'))
        
        # Initialize Firebase Admin
        initialize_app(credentials.Certificate(service_account))
        self.db = firestore.client()

    async def get_conversations(self) -> List[Document]:
        """Retrieve all conversations from Firestore and convert to Documents."""
        docs = []
        conversations_ref = self.db.collection('conversations')
        conversations = await conversations_ref.get()

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