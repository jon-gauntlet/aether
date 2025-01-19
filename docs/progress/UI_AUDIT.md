# Component Organization Plan

## Components to Keep and Modify

### Core Chat (Already in Frontend)
- `ChatContainer.jsx`
  - Keep real-time messaging
  - Add space integration
  - Simplify state management

- `ChatMessageList.jsx`
  - Keep message display
  - Add clustering support
  - Add resonance indicators

- `MessageReactions.jsx`
  - Keep as is
  - Already well implemented

### RAG Integration (To Create)
- `DocumentSearch.jsx`
  - Based on existing RAG hooks
  - Add visual feedback
  - Integrate with spaces

- `SearchResults.jsx`
  - Show results with context
  - Add resonance indicators
  - Link to messages

### Space System (To Simplify)
- `Library.jsx`
  - Focus on document organization
  - RAG integration
  - Knowledge visualization

- `Garden.jsx`
  - Focus on chat
  - Message clustering
  - Thread visualization

### Visualization (To Adapt)
- `ConsciousnessField.jsx`
  - Simplify particle system
  - Focus on RAG context
  - Show message relationships

- `MessageCluster.jsx`
  - Keep core clustering
  - Simplify resonance
  - Add RAG context

## Next Steps
1. Copy components to new structure
2. Simplify and adapt each component
3. Wire up core functionality
4. Add RAG integration
5. Test and refine