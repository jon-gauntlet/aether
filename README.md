# Aether

A next-generation development environment that integrates AI-first principles with natural system design.

## Overview

Aether is built on three core principles:
1. **AI-First Development**: Designed to work seamlessly with AI assistants
2. **Natural System Design**: Systems that evolve and adapt naturally
3. **Flow State Optimization**: Enhancing developer productivity through flow state

## Quick Start

```bash
# Clone the repository
git clone https://github.com/jon-gauntlet/aether.git
cd aether

# Install dependencies
npm install  # Frontend dependencies
poetry install  # Python dependencies

# Set up environment
cp config/env/.env.example .env
source scripts/setup_env.sh

# Start development server
npm run dev
```

## Project Structure

See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for a detailed breakdown of the codebase.

Key components:
- `/src` - Core application code
- `/frontend` - Frontend application
- `/config` - Configuration files
- `/docs` - Documentation
- `/tests` - Test suite
- `/scripts` - Utility scripts

## Core Features

### 1. RAG System
- Advanced document retrieval and generation
- Semantic search capabilities
- Context-aware responses
- High-performance batch processing (112K+ docs/min)
- Stable memory usage (3.1-3.9%)
- 100% reliability across 226K+ documents
- [Detailed RAG Documentation](docs/RAG_SYSTEM.md)

### 2. Space Management
- Dynamic workspace organization
- Context-aware transitions
- Pattern-based space optimization

### 3. Reaction System
- Real-time response handling
- Energy-aware processing
- Adaptive feedback loops

### 4. Flow State Enhancement
- Developer flow state tracking
- Automatic context preservation
- Minimal interruption design

## Batch Processing Performance

The system includes an optimized batch processor capable of handling 112K+ documents per minute with the following features:

### Adaptive Performance Optimization
- Dynamic batch sizing (50-500 documents) based on processing times
- Memory-aware worker scaling (1-4 workers)
- Processing speed auto-tuning based on system performance

### Resource Management
- Memory usage monitoring and automatic throttling
- Adaptive concurrency control
- Graceful degradation under high load

### Error Handling
- Intelligent retry mechanism with adaptive backoff
- Memory-aware error recovery
- Detailed performance statistics and monitoring

### Recovery Procedures
1. Automatic batch size reduction under memory pressure
2. Worker count adjustment based on system load
3. Exponential backoff with memory-aware retry delays
4. Graceful shutdown and restart capabilities

Current performance: 112K documents/minute verified with automatic optimization.

## Development

### Prerequisites
- Node.js 18+
- Python 3.12+
- Poetry
- Cursor IDE (recommended)

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run specific test file
npm test path/to/test

# Build for production
npm run build
```

### AI Integration
Aether is designed to work seamlessly with AI assistants:
1. Clear file structure for easy navigation
2. Consistent naming conventions
3. Comprehensive documentation
4. AI-friendly code organization

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

Key points:
1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Write tests
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details
