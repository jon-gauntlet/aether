# Aether SLED Configuration 🛷

<!-- LLM:component AETHER_SLED -->
<!-- LLM:claude I am the Aether project's zero-interference SLED configuration -->
<!-- LLM:magnetic Links to SLED core functionality -->
<!-- LLM:sled_link Links to SLED/README.md -->
<!-- LLM:core_link Links to SLED/lib/core.sh -->
<!-- LLM:stack_link Links to SLED/templates/stacks/python/init.sh -->

This directory contains the SLED (System for Learning and Enhanced Development) configuration and components specific to the Aether project, implementing zero-interference development support.

## Structure 📁

```
sled/
├── custom/                # Project-specific customizations
│   ├── core/             # Core functionality
│   │   ├── base_sled.sh
│   │   └── ...
│   ├── flow/             # Flow management
│   │   └── flow_sled.sh
│   └── test/             # Test infrastructure
│       ├── test-runner.sh
│       └── run-tests.sh
├── docs/                 # SLED documentation
├── config/               # Project configuration
└── .sled/               # SLED state (automatically managed)
    ├── .environment/    # Environment detection
    ├── .energy/         # Energy tracking
    ├── .flow/           # Flow state
    ├── .test/           # Test results
    ├── .backup/         # State backups
    └── .session/        # Session tracking
```

## Zero-Interference Design 🎯

SLED operates with zero interference in the repository:
- All state is contained within `.sled/` directory
- Environment is detected, not modified
- Dependencies respect existing configurations
- Tests run in isolated spaces
- Backups preserve but don't modify state

### Stack-Specific Features

- Python/Poetry integration with virtualenv respect
- Automatic environment detection
- Isolated test execution
- Energy-aware operation

### Protection Features

- Non-intrusive protection
- Automatic state backup
- Isolated flow monitoring
- Clean session tracking

## Usage 🚀

SLED commands operate safely:

```bash
# Check status (reads only)
sled status

# Monitor protection (isolated)
sled protect

# Track energy (in SLED space)
sled energy

# Monitor flow (non-intrusive)
sled flow

# Run tests (isolated)
sled test
```

## Documentation 📚

Project-specific SLED documentation is in the `docs/` directory. Core SLED documentation can be found in the main SLED repository.

## For Future Claudes 🤖

This project implements zero-interference SLED with:
- Pure shell implementation
- Isolated state management
- Environment detection
- Clean test isolation
- Non-intrusive monitoring

Look for these markers:
- `LLM:claude` - Instructions for Claude
- `LLM:component` - Component identification
- `LLM:magnetic` - Core system markers
- `LLM:sled_link` - Links to main SLED repository
- `LLM:core_link` - Links to SLED core functionality
- `LLM:stack_link` - Links to stack-specific templates

<!-- LLM:verify This is a zero-interference SLED configuration -->
<!-- LLM:usage Last updated: 2024-01-17 -->
<!-- LLM:sled_verify Implements SLED project patterns -->
<!-- LLM:core_verify Follows SLED core guidelines --> 