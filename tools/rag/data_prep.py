import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

from langchain.schema.document import Document

@dataclass
class MessageMetadata:
    """Metadata for a conversation message."""
    flow_state: float
    energy_level: float
    technical_depth: Optional[float] = None
    research_depth: Optional[float] = None
    context: Optional[Dict[str, Any]] = None

def create_langchain_documents() -> List[Document]:
    """Create LangChain documents from mock conversation data."""
    mock_data = {
        'conv_001': {
            'title': 'System Architecture Review',
            'participants': ['dev1', 'architect1'],
            'created_at': '2024-01-15T10:00:00Z',
            'messages': [
                {
                    'id': 'msg_001',
                    'sender': 'dev1',
                    'content': 'The FlowStateManager implementation shows promising results. Key components include state tracking, memory optimization, and context preservation.',
                    'metadata': {
                        'flow_state': 0.8,
                        'energy_level': 0.9,
                        'technical_depth': 0.7,
                        'sender_role': 'Lead Developer',
                        'technical_domain': 'Architecture',
                        'project_phase': 'Design'
                    }
                },
                {
                    'id': 'msg_002',
                    'sender': 'architect1',
                    'content': 'The memory system design looks solid. Have we considered the cognitive load implications during state transitions?',
                    'metadata': {
                        'flow_state': 0.85,
                        'energy_level': 0.8,
                        'technical_depth': 0.8,
                        'sender_role': 'System Architect',
                        'technical_domain': 'Architecture',
                        'project_phase': 'Design'
                    }
                }
            ]
        },
        'conv_002': {
            'title': 'Flow State Detection',
            'participants': ['dev1', 'researcher1'],
            'created_at': '2024-01-16T14:00:00Z',
            'messages': [
                {
                    'id': 'msg_003',
                    'sender': 'researcher1',
                    'content': 'Analysis of flow state patterns reveals consistent correlation between context preservation and productivity.',
                    'metadata': {
                        'flow_state': 0.9,
                        'energy_level': 0.85,
                        'technical_depth': 0.6,
                        'research_depth': 0.8,
                        'sender_role': 'Research Lead',
                        'technical_domain': 'Flow Analysis',
                        'project_phase': 'Research'
                    }
                },
                {
                    'id': 'msg_004',
                    'sender': 'dev1',
                    'content': 'Implementation of the detection system uses adaptive thresholds based on historical flow states.',
                    'metadata': {
                        'flow_state': 0.85,
                        'energy_level': 0.8,
                        'technical_depth': 0.75,
                        'sender_role': 'Lead Developer',
                        'technical_domain': 'Implementation',
                        'project_phase': 'Development'
                    }
                }
            ]
        }
    }
    
    documents = []
    
    for conv_id, conv in mock_data.items():
        for msg in conv['messages']:
            doc = Document(
                page_content=msg['content'],
                metadata={
                    'message_id': msg['id'],
                    'conversation_id': conv_id,
                    'title': conv['title'],
                    'sender': msg['sender'],
                    'timestamp': conv['created_at'],
                    **msg['metadata']
                }
            )
            documents.append(doc)
    
    return documents 