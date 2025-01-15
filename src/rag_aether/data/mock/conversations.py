"""Mock conversations for testing the RAG system."""

def get_mock_conversations():
    """Return a list of mock conversations."""
    return [
        {
            "id": "conv_001",
            "title": "Flow State Implementation Discussion",
            "messages": [
                {
                    "id": "msg_001",
                    "content": """
                    The Flow State Manager implementation should focus on three key aspects:
                    1. Memory optimization during deep work sessions
                    2. Context preservation across interruptions
                    3. Adaptive resource allocation based on cognitive load
                    
                    I've been researching memory patterns during flow states, and I think we
                    should implement a two-tier architecture that handles both immediate context
                    and background processing differently.
                    """,
                    "metadata": {
                        "type": "technical_discussion",
                        "flow_state": 0.8,
                        "context": {
                            "document_type": "implementation",
                            "code_references": ["FlowStateManager.rs", "memory.rs"]
                        }
                    }
                }
            ]
        },
        {
            "id": "conv_002",
            "title": "Deep Work Research Findings",
            "messages": [
                {
                    "id": "msg_002",
                    "content": """
                    Our research on deep work patterns has revealed several interesting insights:
                    1. Developers maintain peak flow state for 2-3 hours on average
                    2. Context switching costs are highest after deep technical discussions
                    3. Code review sessions show unique cognitive load patterns
                    
                    These findings suggest we should optimize our system for longer uninterrupted
                    sessions while providing robust state preservation for inevitable interruptions.
                    """,
                    "metadata": {
                        "type": "research_findings",
                        "flow_state": 0.9,
                        "context": {
                            "document_type": "research",
                            "research_references": ["deep_work_patterns.pdf"]
                        }
                    }
                }
            ]
        }
    ] 