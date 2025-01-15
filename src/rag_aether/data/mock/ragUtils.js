import { mockUsers } from './users';
import { mockConversations } from './conversations';

/**
 * Example RAG queries and their expected data points
 */
export const exampleQueries = {
  technical_implementation: [
    {
      query: "What are the proposed solutions for optimizing system performance during flow states?",
      relevant_messages: ['msg_001', 'msg_003'],
      expected_insights: [
        'Memory usage patterns',
        'Two-tier architecture approach',
        'Rust implementation for core processing'
      ]
    },
    {
      query: "How does the system handle different user types and their flow patterns?",
      relevant_messages: ['msg_004', 'msg_005'],
      expected_insights: [
        'Dynamic resource allocation',
        'Adaptive caching strategies',
        'User-specific optimizations'
      ]
    },
    {
      query: "What is the proposed architecture for flow state memory management?",
      relevant_messages: ['msg_010', 'msg_011'],
      expected_insights: [
        'Three-tier memory system',
        'Cognitive load considerations',
        'Performance impact analysis'
      ]
    }
  ],
  user_research: [
    {
      query: "What are the key findings about user behavior during flow states?",
      relevant_messages: ['msg_002', 'msg_004'],
      expected_insights: [
        'Interaction patterns',
        'Flow state durations',
        'Context switching impacts'
      ]
    },
    {
      query: "How do different user types handle context switching?",
      relevant_messages: ['msg_004', 'msg_009'],
      expected_insights: [
        'Technical vs creative users',
        'Context switch frequency',
        'Memory impact patterns'
      ]
    }
  ],
  code_review: [
    {
      query: "What are the key components of the FlowStateManager implementation?",
      relevant_messages: ['msg_006', 'msg_007'],
      expected_insights: [
        'Core structure',
        'Context caching mechanism',
        'State transition handling'
      ]
    }
  ],
  debugging: [
    {
      query: "What are the memory issues during flow state transitions?",
      relevant_messages: ['msg_008', 'msg_009'],
      expected_insights: [
        'Memory leak patterns',
        'Performance impact',
        'User experience effects'
      ]
    }
  ],
  architecture_decisions: [
    {
      query: "What is the rationale behind the three-tier memory management system?",
      relevant_messages: ['msg_010', 'msg_011'],
      expected_insights: [
        'System constraints',
        'User experience considerations',
        'Performance tradeoffs'
      ]
    }
  ]
};

/**
 * Helper function to extract technical context from conversations
 */
export function extractTechnicalContext(conversations) {
  return conversations.map(conv => ({
    id: conv.id,
    technical_aspects: {
      domain: conv.context.technical_domain,
      code_references: conv.messages.flatMap(msg => 
        msg.metadata?.context?.code_references || []
      ),
      proposed_technologies: conv.messages.flatMap(msg =>
        msg.metadata?.context?.proposed_technologies || []
      ),
      performance_metrics: conv.messages.reduce((metrics, msg) => ({
        ...metrics,
        ...(msg.metadata?.context?.performance_metrics || {})
      }), {}),
      system_metrics: conv.messages.reduce((metrics, msg) => ({
        ...metrics,
        ...(msg.metadata?.context?.system_metrics || {})
      }), {}),
      debug_artifacts: conv.messages.flatMap(msg =>
        msg.metadata?.context?.debug_artifacts || []
      )
    },
    context: {
      project_phase: conv.context.project_phase,
      meeting_context: conv.context.meeting_context,
      system_state: conv.context.system_state,
      document_context: conv.context.document_context
    }
  }));
}

/**
 * Helper function to analyze collaboration patterns
 */
export function analyzeCollaborationPatterns(conversations) {
  return conversations.map(conv => ({
    id: conv.id,
    pattern: {
      technical_user_contributions: conv.messages.filter(m => 
        m.sender === 'zippo8642'
      ).length,
      research_user_contributions: conv.messages.filter(m => 
        m.sender === 'jdycaico@tutanota.com'
      ).length,
      average_flow_state: conv.messages.reduce((sum, m) => 
        sum + (m.metadata?.flow_state || 0), 0) / conv.messages.length,
      knowledge_synthesis: conv.context.collaboration_type === 'Knowledge Synthesis',
      interaction_types: {
        code_reviews: conv.messages.filter(m => m.metadata?.context?.code_references).length,
        architecture_decisions: conv.messages.filter(m => m.metadata?.context?.document_type === 'ADR').length,
        debugging_sessions: conv.messages.filter(m => m.metadata?.context?.debug_artifacts).length
      },
      thread_depth: conv.messages.reduce((sum, m) => 
        sum + (m.thread?.length || 0), 0),
      reactions: conv.messages.reduce((sum, m) => 
        sum + (m.reactions?.length || 0), 0)
    }
  }));
}

/**
 * Helper function to extract user research insights
 */
export function extractResearchInsights(conversations) {
  return conversations.flatMap(conv => 
    conv.messages
      .filter(msg => msg.sender === 'jdycaico@tutanota.com')
      .map(msg => ({
        timestamp: msg.timestamp,
        insights: {
          research_references: msg.metadata?.context?.research_references || [],
          user_patterns: msg.metadata?.context?.user_patterns || [],
          methodology: msg.metadata?.context?.research_methodology,
          data_points: msg.metadata?.context?.data_points || [],
          observed_patterns: msg.metadata?.context?.observed_patterns || {},
          proposed_metrics: msg.metadata?.context?.proposed_metrics || []
        },
        flow_state: msg.metadata?.flow_state,
        research_depth: msg.metadata?.research_depth,
        context: {
          project_phase: conv.context.project_phase,
          collaboration_type: conv.context.collaboration_type
        }
      }))
  );
}

/**
 * Helper function to analyze work style patterns
 */
export function analyzeWorkStyles(users, conversations) {
  return Object.entries(users).map(([userId, user]) => ({
    id: userId,
    role: user.role,
    work_pattern: {
      style: user.profile.workStyle,
      expertise_areas: user.profile.expertise,
      flow_characteristics: {
        average_duration: user.metrics.average_flow_duration,
        peak_hours: user.metrics.energy_patterns.peak_hours,
        context_switching: user.metrics.context_switching_cost
      },
      communication: conversations.flatMap(conv => 
        conv.messages
          .filter(msg => msg.sender === userId)
          .map(msg => ({
            technical_depth: msg.metadata?.technical_depth || 0,
            research_depth: msg.metadata?.research_depth || 0,
            flow_state: msg.metadata?.flow_state || 0,
            energy_level: msg.metadata?.energy_level || 0,
            context_type: conv.context.technical_domain,
            has_code: msg.content.includes('```'),
            has_thread: !!msg.thread,
            has_reactions: !!(msg.reactions && msg.reactions.length > 0)
          }))
      )
    }
  }));
}

/**
 * Helper function to analyze code discussions
 */
export function analyzeCodeDiscussions(conversations) {
  return conversations
    .filter(conv => conv.messages.some(m => m.content.includes('```')))
    .map(conv => ({
      id: conv.id,
      context: {
        project_phase: conv.context.project_phase,
        technical_domain: conv.context.technical_domain,
        meeting_context: conv.context.meeting_context
      },
      code_snippets: conv.messages
        .filter(m => m.content.includes('```'))
        .map(m => ({
          sender: m.sender,
          timestamp: m.timestamp,
          language: m.content.split('```')[1].split('\n')[0],
          code: m.content.split('```')[1].split('\n').slice(1).join('\n'),
          context: m.metadata?.context
        })),
      related_files: conv.messages.flatMap(m => 
        m.metadata?.context?.code_references || []
      ),
      flow_states: conv.messages.map(m => ({
        timestamp: m.timestamp,
        flow_state: m.metadata?.flow_state,
        energy_level: m.metadata?.energy_level
      }))
    }));
}

/**
 * Helper function to analyze system states and interruptions
 */
export function analyzeSystemStates(conversations) {
  return conversations.map(conv => ({
    id: conv.id,
    timestamp: conv.created_at,
    context: conv.context,
    flow_patterns: {
      average_flow: conv.messages.reduce((sum, m) => 
        sum + (m.metadata?.flow_state || 0), 0) / conv.messages.length,
      flow_variations: conv.messages.map(m => ({
        timestamp: m.timestamp,
        flow_state: m.metadata?.flow_state,
        energy_level: m.metadata?.energy_level
      })),
      interruptions: conv.messages
        .filter(m => m.metadata?.flow_state < 0.7)
        .map(m => ({
          timestamp: m.timestamp,
          flow_drop: m.metadata?.flow_state,
          context: m.metadata?.context
        }))
    },
    system_metrics: conv.messages.reduce((metrics, m) => ({
      ...metrics,
      ...(m.metadata?.context?.system_metrics || {})
    }), {})
  }));
}

// Export test data for easy access
export const testData = {
  users: mockUsers,
  conversations: mockConversations
}; 