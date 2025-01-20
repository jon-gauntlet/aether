# Aether

A modern RAG (Retrieval-Augmented Generation) system built with React and Python.

## Repository Structure

```
.
├── config/           # Configuration files for all tools and services
├── docs/            # Documentation
│   ├── api/         # API documentation and prompts
│   └── development/ # Development notes and progress
├── scripts/         # Utility scripts
│   ├── setup/      # Setup and initialization scripts
│   └── verification/ # Verification and analysis scripts
├── src/             # Main source code
│   ├── components/  # React components
│   ├── contexts/    # React contexts
│   ├── hooks/       # Custom React hooks
│   ├── rag_aether/  # RAG implementation
│   ├── services/    # Service layer
│   └── utils/       # Utility functions
└── tests/           # All test files
    ├── e2e/        # End-to-end tests
    ├── integration/ # Integration tests
    └── unit/       # Unit tests
```

## Key Technologies

- Frontend: React, Vite
- Backend: Python, FastAPI
- RAG: OpenAI, FAISS
- Testing: Pytest, Vitest, Testing Library

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values
3. Install dependencies:
   ```bash
   # Python dependencies
   pip install -r requirements.txt
   
   # Node dependencies
   npm install
   ```
4. Run the development servers:
   ```bash
   # Backend
   python -m src.main
   
   # Frontend
   npm run dev
   ```

## Development

- All configuration files are in the `config/` directory
- Frontend code is in `src/` with React components, contexts, etc.
- Backend RAG implementation is in `src/rag_aether/`
- Tests are in `tests/` directory with clear separation:
  - End-to-end tests in `tests/e2e/`
  - Integration tests in `tests/integration/`
  - Unit tests in `tests/unit/`

## Testing

### Running End-to-End Tests
```bash
# Run the chat system E2E test
npm test tests/e2e/frontend/chat.test.jsx

# Run all frontend tests
npm test

# Run with coverage
npm run test:coverage
```

### Running Backend Tests
```bash
# Run all backend tests
pytest

# Run specific test directory
pytest tests/unit/backend

# Run with coverage
pytest --cov=src tests/
```

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Contributing

1. Read `docs/development/` for development guidelines
2. Check `docs/api/` for API documentation
3. Run tests before submitting changes:
   ```bash
   # Run all tests
   pytest tests/
   npm test
   ```

## License

See LICENSE file for details.
