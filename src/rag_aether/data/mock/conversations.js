import { mockUsers } from './users';

export const mockConversations = [
  {
    id: 'conv_001',
    title: 'System Architecture Review - Flow State Optimization',
    participants: ['zippo8642', 'jdycaico@tutanota.com'],
    created_at: '2024-01-15T09:30:00Z',
    context: {
      project_phase: 'Design',
      technical_domain: 'System Architecture',
      collaboration_type: 'Cross-functional Review'
    },
    messages: [
      {
        id: 'msg_001',
        sender: 'zippo8642',
        timestamp: '2024-01-15T09:30:00Z',
        content: "I've been analyzing our system's performance patterns during high-load periods. The current architecture shows interesting behavior when users enter flow states. Here's what I've found:\n\n1. Memory usage spikes by 25% during deep flow states\n2. Context switching overhead increases significantly\n3. We need to optimize our real-time processing pipeline",
        metadata: {
          flow_state: 0.85,
          energy_level: 0.9,
          technical_depth: 0.8,
          context: {
            code_references: ['src/core/flow/FlowStateManager.ts'],
            performance_metrics: {
              memory_usage: '25% increase',
              latency: '150ms average'
            }
          }
        }
      },
      {
        id: 'msg_002',
        sender: 'jdycaico@tutanota.com',
        timestamp: '2024-01-15T09:35:00Z',
        content: "This aligns with our recent user research findings. We've observed that users in flow states exhibit distinct interaction patterns:\n\n- Rapid context switching between related tasks\n- Increased sensitivity to system latency\n- Higher cognitive load during deep work phases\n\nPerhaps we could implement predictive loading based on these patterns?",
        metadata: {
          flow_state: 0.75,
          energy_level: 0.85,
          research_context: 0.9,
          context: {
            research_references: ['User Behavior Study #45', 'Flow State Analysis Report'],
            user_patterns: ['rapid_switching', 'latency_sensitivity']
          }
        }
      },
      {
        id: 'msg_003',
        sender: 'zippo8642',
        timestamp: '2024-01-15T09:40:00Z',
        content: "Interesting idea about predictive loading. We could implement a two-tier approach:\n\n1. Primary tier: Essential system components with minimal latency\n2. Secondary tier: Predictive loading based on user flow patterns\n\nI'm thinking of using Rust for the core processing pipeline to optimize memory usage and reduce latency. Thoughts on this approach?",
        metadata: {
          flow_state: 0.9,
          energy_level: 0.85,
          technical_depth: 0.9,
          context: {
            architecture_components: ['processing_pipeline', 'memory_management'],
            proposed_technologies: ['Rust', 'async_processing']
          }
        }
      }
    ]
  },
  {
    id: 'conv_002',
    title: 'UX Research Integration - Cognitive Patterns',
    participants: ['jdycaico@tutanota.com', 'zippo8642'],
    created_at: '2024-01-16T14:15:00Z',
    context: {
      project_phase: 'Research Integration',
      technical_domain: 'UX Research',
      collaboration_type: 'Knowledge Synthesis'
    },
    messages: [
      {
        id: 'msg_004',
        sender: 'jdycaico@tutanota.com',
        timestamp: '2024-01-16T14:15:00Z',
        content: "Our latest research reveals fascinating patterns in how different user types maintain flow states. Key findings:\n\n1. Technical users average 45-minute deep flow periods\n2. Creative users show more frequent but shorter flow states\n3. Context switching costs vary significantly by user type\n\nHow can we adapt the system architecture to support these patterns?",
        metadata: {
          flow_state: 0.8,
          energy_level: 0.9,
          research_depth: 0.85,
          context: {
            research_methodology: 'Mixed Methods',
            data_points: ['flow_duration', 'context_switching', 'user_types']
          }
        }
      },
      {
        id: 'msg_005',
        sender: 'zippo8642',
        timestamp: '2024-01-16T14:20:00Z',
        content: "These insights are valuable for our architecture decisions. We could implement:\n\n1. Dynamic resource allocation based on flow state duration\n2. Adaptive caching strategies for different user types\n3. Intelligent context preservation mechanisms\n\nI'm particularly interested in implementing a smart caching layer that adapts to these patterns.",
        metadata: {
          flow_state: 0.85,
          energy_level: 0.8,
          technical_depth: 0.9,
          context: {
            system_components: ['resource_allocator', 'cache_manager'],
            optimization_targets: ['context_preservation', 'resource_efficiency']
          }
        }
      }
    ]
  },
  {
    id: 'conv_003',
    title: 'Code Review: Flow State Manager Implementation',
    participants: ['zippo8642', 'jdycaico@tutanota.com'],
    created_at: '2024-01-17T08:15:00Z',
    context: {
      project_phase: 'Implementation',
      technical_domain: 'Code Review',
      collaboration_type: 'Pair Programming',
      meeting_context: {
        type: 'Code Review',
        focus: 'Implementation Details',
        scheduled_duration: 45
      }
    },
    messages: [
      {
        id: 'msg_006',
        sender: 'zippo8642',
        timestamp: '2024-01-17T08:15:00Z',
        content: "I've implemented the FlowStateManager with optimized context switching. Here's the core implementation:\n\n```rust\npub struct FlowStateManager {\n    current_state: Arc<RwLock<FlowState>>,\n    context_cache: LruCache<ContextId, FlowContext>,\n    metrics: FlowMetrics,\n}\n\nimpl FlowStateManager {\n    pub async fn transition_state(&self, new_state: FlowState) -> Result<(), FlowError> {\n        let mut state = self.current_state.write().await;\n        self.metrics.record_transition(&state, &new_state);\n        *state = new_state;\n        self.context_cache.refresh().await;\n        Ok(())\n    }\n}```\n\nThe key optimization is in the context_cache refresh mechanism.",
        metadata: {
          flow_state: 0.95,
          energy_level: 0.9,
          technical_depth: 0.95,
          context: {
            code_references: ['src/core/flow/FlowStateManager.rs'],
            commit_id: 'abc123',
            diff_context: {
              files_changed: 1,
              insertions: 45,
              deletions: 12
            }
          }
        },
        reactions: [
          { user: 'jdycaico@tutanota.com', type: '👍', timestamp: '2024-01-17T08:16:00Z' },
          { user: 'jdycaico@tutanota.com', type: '🚀', timestamp: '2024-01-17T08:16:02Z' }
        ]
      },
      {
        id: 'msg_007',
        sender: 'jdycaico@tutanota.com',
        timestamp: '2024-01-17T08:20:00Z',
        content: "The implementation looks solid from a cognitive load perspective. A few observations:\n\n1. The LruCache for context switching aligns with our research on cognitive stack management\n2. The async transition_state matches natural flow state transitions\n3. Consider adding a cooldown period after rapid transitions to prevent cognitive thrashing",
        metadata: {
          flow_state: 0.8,
          energy_level: 0.85,
          research_context: 0.9,
          context: {
            research_references: ['Cognitive Load Study #28'],
            related_patterns: ['context_switching', 'cognitive_cooldown']
          }
        },
        thread_starter: true,
        thread: [
          {
            id: 'msg_007_reply_1',
            sender: 'zippo8642',
            timestamp: '2024-01-17T08:22:00Z',
            content: "Good point about the cooldown period. We could add:\n\n```rust\npub struct TransitionConfig {\n    cooldown_ms: u64,\n    min_state_duration: u64,\n}\n```",
            metadata: {
              flow_state: 0.9,
              technical_depth: 0.85
            }
          }
        ]
      }
    ]
  },
  {
    id: 'conv_004',
    title: 'Debugging Session: Memory Spikes During Flow Transitions',
    participants: ['zippo8642', 'jdycaico@tutanota.com'],
    created_at: '2024-01-17T15:30:00Z',
    context: {
      project_phase: 'Debug',
      technical_domain: 'Performance Optimization',
      collaboration_type: 'Problem Solving',
      system_state: {
        issue_type: 'Memory Leak',
        severity: 'High',
        impact_area: 'Flow State Transitions'
      }
    },
    messages: [
      {
        id: 'msg_008',
        sender: 'zippo8642',
        timestamp: '2024-01-17T15:30:00Z',
        content: "Found a concerning memory pattern during rapid flow state transitions. Here's the heap profile:\n\n```\nHeap Analysis:\n- Base memory: 124MB\n- Spike during transition: 512MB\n- Leak rate: ~2MB/transition\n\nStack trace:\nFlowStateManager::transition_state\n  ├─ context_cache.refresh\n  │   └─ memory::allocate_new_context\n  └─ metrics.record_transition\n```\n\nLooks like we're not properly cleaning up old context caches.",
        metadata: {
          flow_state: 0.7,
          energy_level: 0.6,
          technical_depth: 0.95,
          context: {
            debug_artifacts: ['heap_profile.json', 'memory_trace.log'],
            system_metrics: {
              cpu_usage: '45%',
              memory_pressure: 'high',
              gc_cycles: 12
            }
          }
        },
        thread_starter: true
      },
      {
        id: 'msg_009',
        sender: 'jdycaico@tutanota.com',
        timestamp: '2024-01-17T15:35:00Z',
        content: "This aligns with our user reports of system sluggishness during intense work sessions. From our observations:\n\n1. Users typically switch contexts 3-4 times during deep flow\n2. Each switch generates ~15 new context items\n3. Memory pressure correlates with reduced flow state quality\n\nCould we implement a predictive cleanup based on these patterns?",
        metadata: {
          flow_state: 0.75,
          energy_level: 0.7,
          research_context: 0.8,
          context: {
            user_reports: ['FLOW-245', 'PERF-112'],
            observed_patterns: {
              context_switches_per_flow: 3.5,
              items_per_switch: 15,
              memory_impact: 'significant'
            }
          }
        }
      }
    ]
  },
  {
    id: 'conv_005',
    title: 'Architecture Decision Record: Flow State Optimization',
    participants: ['zippo8642', 'jdycaico@tutanota.com'],
    created_at: '2024-01-18T10:00:00Z',
    context: {
      project_phase: 'Design',
      technical_domain: 'Architecture',
      collaboration_type: 'Decision Making',
      document_context: {
        type: 'ADR',
        number: 'ADR-042',
        status: 'Proposed'
      }
    },
    messages: [
      {
        id: 'msg_010',
        sender: 'zippo8642',
        timestamp: '2024-01-18T10:00:00Z',
        content: "# ADR-042: Flow State Memory Management\n\n## Context\n- Memory spikes during flow state transitions\n- Context preservation needs vs. resource constraints\n- User experience impact of memory pressure\n\n## Decision\nImplement a three-tier memory management system:\n1. Hot Path: Active context (Rust-based, heap-optimized)\n2. Warm Path: Recent contexts (LRU cache with predictive cleanup)\n3. Cold Path: Archived contexts (Persistent storage)\n\n## Consequences\n- Reduced memory pressure during transitions\n- Slight latency increase for cold context restoration\n- Improved system stability during long flow sessions",
        metadata: {
          flow_state: 0.9,
          energy_level: 0.85,
          technical_depth: 0.95,
          context: {
            document_type: 'ADR',
            references: [
              'ADR-038: Flow State Architecture',
              'ADR-040: Memory Management Strategy'
            ],
            system_impact: {
              performance: 'high',
              maintenance: 'medium',
              scalability: 'high'
            }
          }
        },
        reactions: [
          { user: 'jdycaico@tutanota.com', type: '💡', timestamp: '2024-01-18T10:02:00Z' }
        ]
      },
      {
        id: 'msg_011',
        sender: 'jdycaico@tutanota.com',
        timestamp: '2024-01-18T10:15:00Z',
        content: "This architecture aligns well with our cognitive load research. Additional considerations:\n\n1. Cognitive Context Preservation\n- Hot path matches active working memory patterns\n- Warm path aligns with short-term memory capacity\n- Cold path mirrors long-term memory consolidation\n\n2. User Impact\n- Reduced mental overhead during context switches\n- Natural alignment with flow state phases\n- Improved recovery from interruptions\n\nRecommend adding metrics for cognitive load correlation with each tier.",
        metadata: {
          flow_state: 0.85,
          energy_level: 0.8,
          research_depth: 0.9,
          context: {
            research_references: [
              'Cognitive Load in Flow States: A Meta-Analysis',
              'Memory Systems in Deep Work'
            ],
            proposed_metrics: [
              'cognitive_load_per_tier',
              'context_switch_efficiency',
              'recovery_time_impact'
            ]
          }
        },
        thread_starter: true,
        thread: [
          {
            id: 'msg_011_reply_1',
            sender: 'zippo8642',
            timestamp: '2024-01-18T10:20:00Z',
            content: "Excellent points. I'll add cognitive load metrics to the monitoring system:\n\n```rust\npub struct TierMetrics {\n    cognitive_load: f64,\n    context_switches: u32,\n    recovery_time_ms: u64,\n    correlation_score: f64\n}\n```",
            metadata: {
              flow_state: 0.9,
              technical_depth: 0.85,
              context: {
                code_references: ['src/metrics/cognitive_load.rs']
              }
            }
          }
        ]
      }
    ]
  }
]; 