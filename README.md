# RAG Aether

A Retrieval-Augmented Generation (RAG) system with flow state protection for enhanced developer productivity.

## Features

- Flow state tracking and optimization
- Adaptive search based on energy levels and focus depth
- Context-aware document retrieval
- Mock data for testing and development

## Setup

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Create a `.env` file with your OpenAI service account key and organization ID:
```
OPENAI_API_KEY=sk-svcacct-your-service-account-key-here
OPENAI_ORG_ID=org-your-org-id-here
```

## Project Structure

- `tools/rag/`: Core RAG implementation
  - `core.py`: Main RAG system with flow protection
  - `data_prep.py`: Data preparation utilities
  - `test_rag.py`: Test suite
- `src/data/mock/`: Mock data for testing
  - `conversations.js`: Sample conversations
  - `ragUtils.js`: Utility functions

## Testing

Run the test suite:
```bash
python -m tools.rag.test_rag
```

## License

MIT 
