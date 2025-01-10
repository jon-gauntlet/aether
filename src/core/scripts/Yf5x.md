# AI System Evolution

An autonomic computing system that continuously evolves and optimizes itself using AI-driven decision making.

## Overview

This project implements an autonomic computing system based on the MAPE-K (Monitor, Analyze, Plan, Execute, Knowledge) loop pattern. The system monitors its own operation, analyzes patterns and anomalies, plans appropriate actions, and executes them while building up a knowledge base of successful strategies.

### Key Features

- **Self-Monitoring**: Collects system metrics, resource usage, and operational patterns
- **Pattern Analysis**: Detects trends, cycles, and anomalies in system behavior
- **Autonomous Planning**: Determines optimal actions based on analysis and past experience
- **Self-Optimization**: Executes planned actions to improve system performance
- **Knowledge Management**: Builds and maintains a knowledge base of patterns and strategies

## Architecture

The system is composed of several key components that work together to implement the MAPE-K loop:

### Monitor
- Collects system metrics (CPU, memory, I/O)
- Tracks resource usage patterns
- Stores time-series metrics data

### Analyzer
- Detects anomalies in metrics
- Identifies usage patterns
- Calculates confidence scores

### Planner
- Determines appropriate actions
- Prioritizes action execution
- Considers resource constraints

### Executor
- Carries out planned actions
- Manages resource scaling
- Handles error recovery

### Knowledge Base
- Stores detected patterns
- Records successful strategies
- Maintains optimization history

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai_system_evolution.git
cd ai_system_evolution
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure the system:
```bash
cp config/autonomic.json.example config/autonomic.json
# Edit config/autonomic.json with your settings
```

5. Install the systemd service:
```bash
mkdir -p ~/.config/systemd/user
cp systemd/autonomic-manager.service ~/.config/systemd/user/
systemctl --user daemon-reload
```

## Usage

### Starting the System

Start the autonomic manager service:
```bash
systemctl --user start autonomic-manager
```

Enable automatic startup:
```bash
systemctl --user enable autonomic-manager
```

### Monitoring

Check service status:
```bash
systemctl --user status autonomic-manager
```

View logs:
```bash
journalctl --user -u autonomic-manager
```

### Configuration

The system can be configured through several JSON files:

- `config/autonomic.json`: Main system configuration
- `config/context_service.json`: Context management settings
- `config/pattern_service.json`: Pattern detection settings
- `config/scaling.json`: Resource scaling rules
- `config/optimization.json`: Performance optimization settings

## Development

### Project Structure

```
ai_system_evolution/
├── config/                 # Configuration files
├── data/                  # Data storage
│   ├── metrics/          # Time-series metrics
│   ├── patterns/         # Detected patterns
│   └── knowledge/        # Knowledge base
├── lib/                   # Core library code
│   └── autonomic/        # MAPE-K components
├── tests/                 # Test suite
└── tools/                # Development tools
```

### Running Tests

```bash
pytest tests/
```

### Code Style

The project uses:
- Black for code formatting
- Flake8 for style checking
- MyPy for type checking
- Pylint for code analysis

Run all checks:
```bash
./tools/check_code.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the test suite
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- IBM for the MAPE-K reference architecture
- The autonomic computing research community
- All contributors to this project 