"""Mock conversation data for testing the RAG system."""

MOCK_CONVERSATIONS = [
    {
        "id": "conv_001",
        "title": "System Architecture Review - Flow State Optimization",
        "participants": ["zippo8642", "jdycaico@tutanota.com"],
        "created_at": "2024-01-15T09:30:00Z",
        "context": {
            "project_phase": "Design",
            "technical_domain": "System Architecture",
            "collaboration_type": "Cross-functional Review"
        },
        "messages": [
            {
                "id": "msg_001",
                "sender": "zippo8642",
                "timestamp": "2024-01-15T09:30:00Z",
                "content": """I've been analyzing our system's performance patterns during high-load periods. The current architecture shows interesting behavior when users enter flow states. Here's what I've found:

1. Memory usage spikes by 25% during deep flow states
2. Context switching overhead increases significantly
3. We need to optimize our real-time processing pipeline""",
                "metadata": {
                    "flow_state": 0.85,
                    "energy_level": 0.9,
                    "technical_depth": 0.8,
                    "context": {
                        "code_references": ["src/core/flow/FlowStateManager.ts"],
                        "performance_metrics": {
                            "memory_usage": "25% increase",
                            "latency": "150ms average"
                        }
                    }
                }
            },
            {
                "id": "msg_002",
                "sender": "jdycaico@tutanota.com",
                "timestamp": "2024-01-15T09:35:00Z",
                "content": """This aligns with our recent user research findings. We've observed that users in flow states exhibit distinct interaction patterns:

- Rapid context switching between related tasks
- Increased sensitivity to system latency
- Higher cognitive load during deep work phases

Perhaps we could implement predictive loading based on these patterns?""",
                "metadata": {
                    "flow_state": 0.75,
                    "energy_level": 0.85,
                    "research_context": 0.9,
                    "context": {
                        "research_references": ["User Behavior Study #45", "Flow State Analysis Report"],
                        "user_patterns": ["rapid_switching", "latency_sensitivity"]
                    }
                }
            }
        ]
    },
    {
        "id": "conv_003",
        "title": "Code Review: Flow State Manager Implementation",
        "participants": ["zippo8642", "jdycaico@tutanota.com"],
        "created_at": "2024-01-17T08:15:00Z",
        "context": {
            "project_phase": "Implementation",
            "technical_domain": "Code Review",
            "collaboration_type": "Pair Programming"
        },
        "messages": [
            {
                "id": "msg_006",
                "sender": "zippo8642",
                "timestamp": "2024-01-17T08:15:00Z",
                "content": """I've implemented the FlowStateManager with optimized context switching. Here's the core implementation:

```rust
pub struct FlowStateManager {
    current_state: Arc<RwLock<FlowState>>,
    context_cache: LruCache<ContextId, FlowContext>,
    metrics: FlowMetrics,
}

impl FlowStateManager {
    pub async fn transition_state(&self, new_state: FlowState) -> Result<(), FlowError> {
        let mut state = self.current_state.write().await;
        self.metrics.record_transition(&state, &new_state);
        *state = new_state;
        self.context_cache.refresh().await;
        Ok(())
    }
}
```

The key optimization is in the context_cache refresh mechanism.""",
                "metadata": {
                    "flow_state": 0.95,
                    "energy_level": 0.9,
                    "technical_depth": 0.95,
                    "context": {
                        "code_references": ["src/core/flow/FlowStateManager.rs"],
                        "commit_id": "abc123",
                        "diff_context": {
                            "files_changed": 1,
                            "insertions": 45,
                            "deletions": 12
                        }
                    }
                }
            },
            {
                "id": "msg_007",
                "sender": "jdycaico@tutanota.com",
                "timestamp": "2024-01-17T08:20:00Z",
                "content": """The implementation looks solid from a cognitive load perspective. A few observations:

1. The LruCache for context switching aligns with our research on cognitive stack management
2. The async transition_state matches natural flow state transitions
3. Consider adding a cooldown period after rapid transitions to prevent cognitive thrashing""",
                "metadata": {
                    "flow_state": 0.8,
                    "energy_level": 0.85,
                    "research_context": 0.9,
                    "context": {
                        "research_references": ["Cognitive Load Study #28"],
                        "related_patterns": ["context_switching", "cognitive_cooldown"]
                    }
                }
            }
        ]
    }
]

def get_mock_conversations():
    """Get the mock conversation data."""
    return MOCK_CONVERSATIONS 