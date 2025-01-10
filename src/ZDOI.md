# AI System Evolution

A framework for evolving AI systems with local LLM integration and resource-aware management.

## Features

- Resource-aware LLM model management
- Automatic model loading and unloading
- Configurable model parameters and capabilities
- Proper error handling and recovery
- Metrics collection and monitoring

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai_system_evolution.git
cd ai_system_evolution
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure your models:
- Place model files in `data/models/`
- Create config files following `data/models/sample.config.json`

## Usage

### Basic Usage

```python
from services.llm_service import LLMService

async def main():
    service = LLMService()
    await service.initialize()
    
    try:
        model = await service.get_model("llama-7b-chat")
        if model:
            # Use the model
            pass
    finally:
        await service.shutdown()
```

### Model Configuration

Create a JSON configuration file for each model:

```json
{
    "name": "model-name",
    "version": "1.0.0",
    "memory_requirements_gb": 4.0,
    "capabilities": ["chat", "completion"],
    "parameters": {
        "max_tokens": 2048,
        "temperature": 0.7
    }
}
```

## Architecture

The system consists of several key components:

1. **LLM Service**: Main service for model management
2. **Model Manager**: Handles model loading and resource management
3. **Model Instance**: Wraps individual model instances
4. **Configuration**: JSON-based model configuration

## Development

### Running Tests

```bash
pytest tests/
```

### Adding New Models

1. Add model file to `data/models/`
2. Create corresponding config file
3. Update capabilities in service if needed

## License

MIT License - See LICENSE file for details