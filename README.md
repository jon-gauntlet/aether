# RAG Aether

A Retrieval-Augmented Generation (RAG) system powered by Anthropic's Claude, with flow state protection for enhanced developer productivity.

## Features

- Flow state tracking and optimization
- Adaptive search based on energy levels and focus depth
- Context-aware document retrieval
- Anthropic Claude integration for high-quality responses

## Setup

1. Prerequisites:
   - Python 3.13+
   - Poetry (package manager)

2. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rag-aether.git
   cd rag-aether
   ```

3. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

4. Create a `.env` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```

## Development Environment

This project uses Poetry for dependency management. Here are some common commands:

- Activate the virtual environment:
  ```bash
  poetry shell
  ```

- Run tests:
  ```bash
  poetry run python test_rag_clean.py
  ```

- Add new dependencies:
  ```bash
  poetry add package-name
  ```

- Update dependencies:
  ```bash
  poetry update
  ```

## Project Structure

- `src/rag_aether/`: Core RAG implementation
  - `ai/rag.py`: Main RAG system with Claude integration
  - `data/mock/`: Mock data for testing
- `test_rag_clean.py`: Test suite for RAG functionality

## Testing

Run the test suite to verify the RAG system:
```bash
poetry run python test_rag_clean.py
```

This will test:
1. Document ingestion
2. Vector embeddings
3. Retrieval capabilities
4. Response generation with Claude

## License

MIT 
