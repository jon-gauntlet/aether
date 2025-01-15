# RAG Testing Mock Data

This directory contains structured mock data for testing RAG (Retrieval-Augmented Generation) capabilities in the Aether project. The data simulates interactions between technical and research team members, with rich metadata about flow states, energy levels, and work contexts.

## Data Structure

### Users (`users.js`)
Contains detailed user profiles with:
- Professional roles and expertise
- Work style characteristics
- Flow state and energy patterns
- Technical/research context
- Peak performance hours
- Context switching costs

### Conversations (`conversations.js`)
Simulates technical discussions with:
- Cross-functional collaboration
- Technical implementation details
- UX research insights
- Rich metadata about flow states and context
- Code review discussions
- Debugging sessions
- Architecture decisions
- Thread replies and reactions
- Temporal diversity across days/times

### RAG Utilities (`ragUtils.js`)
Provides helper functions and example queries for testing:
- Technical context extraction
- Collaboration pattern analysis
- Research insight extraction
- Work style analysis
- Code discussion analysis
- System state analysis
- Interruption pattern detection

## Example Queries

### Technical Implementation
```javascript
// Find solutions for performance optimization
"What are the proposed solutions for optimizing system performance during flow states?"

// Analyze system handling of user patterns
"How does the system handle different user types and their flow patterns?"

// Understand memory management architecture
"What is the proposed architecture for flow state memory management?"
```

### Code Reviews
```javascript
// Analyze implementation details
"What are the key components of the FlowStateManager implementation?"
```

### Debugging Sessions
```javascript
// Investigate performance issues
"What are the memory issues during flow state transitions?"
```

### Architecture Decisions
```javascript
// Understand design rationale
"What is the rationale behind the three-tier memory management system?"
```

### User Research
```javascript
// Extract behavior patterns
"What are the key findings about user behavior during flow states?"

// Analyze context switching
"How do different user types handle context switching?"
```

## Usage

```javascript
import { 
  testData, 
  extractTechnicalContext, 
  analyzeWorkStyles,
  analyzeCodeDiscussions,
  analyzeSystemStates 
} from './ragUtils';

// Extract technical implementation details
const technicalContext = extractTechnicalContext(testData.conversations);

// Analyze work patterns
const workStyles = analyzeWorkStyles(testData.users, testData.conversations);

// Analyze code discussions
const codeAnalysis = analyzeCodeDiscussions(testData.conversations);

// Analyze system states and interruptions
const systemStates = analyzeSystemStates(testData.conversations);
```

## Data Points for RAG Testing

1. Technical Implementation
   - Architecture decisions
   - Performance optimizations
   - Technology choices
   - System behavior patterns
   - Code snippets and reviews
   - Debugging insights
   - Memory management strategies

2. User Research
   - Behavioral patterns
   - Flow state characteristics
   - Interaction models
   - Research methodologies
   - Context switching patterns
   - Cognitive load analysis

3. Work Styles
   - Individual approaches
   - Collaboration patterns
   - Technical vs. research focus
   - Flow state preferences
   - Peak performance periods
   - Recovery patterns

4. Code Discussions
   - Implementation details
   - Review comments
   - Technical decisions
   - Performance considerations
   - Language-specific patterns

5. System States
   - Flow state variations
   - Energy level patterns
   - Interruption impacts
   - Recovery mechanisms
   - Performance metrics

6. Interaction Patterns
   - Thread discussions
   - Message reactions
   - Cross-functional collaboration
   - Knowledge synthesis
   - Decision points

7. Temporal Aspects
   - Time-of-day patterns
   - Discussion evolution
   - Project phase transitions
   - Flow state duration
   - Recovery periods

8. Enhanced Metadata
   - Code references
   - Document links
   - Meeting contexts
   - System metrics
   - Debug artifacts
   - Performance data
   - Research references 