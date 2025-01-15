# RAG Claude Implementation Guide 🚀

<!-- LLM:beacon RAG_MVP_ENTRY -->
Focus: Build minimal working RAG with maximum development velocity

## Immediate Actions
1. Use Gauntlet Class 3 examples as reference
2. Start with smallest working RAG implementation
3. Keep Flow Sled protection light but active

## Core Implementation Path
1. Document ingestion (start with in-memory)
2. Basic vector embeddings
3. Simple similarity search
4. Working RAG query flow

## Speed Optimizations
- Use FAISS for fast in-memory vector storage
- Keep chunking simple (1000 tokens, 200 overlap)
- Minimize dependencies (only essential packages)
- Start with basic QA chain, optimize later

## Protection Patterns
- Keep Flow Sled running but light
- Auto-verify after major changes
- Quick recovery if something breaks

## Example Structure
```python
from langchain.chains import RetrievalQA
# ... minimal imports

class RAGSystem:
    def __init__(self):
        # Basic initialization
        pass

    def ingest_text(self, text: str):
        # Simple chunking & storage
        pass

    def query(self, question: str) -> str:
        # Direct retrieval & response
        pass
```

## Success Criteria
- [ ] Documents can be ingested
- [ ] Queries return relevant responses
- [ ] System runs without errors
- [ ] Flow protection is maintained

Remember:
- Speed > Perfection
- Working > Complete
- Flow > Features 