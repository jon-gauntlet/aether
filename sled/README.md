# Aether SLED Configuration 🛷

<!-- LLM:component AETHER_SLED -->
<!-- LLM:claude I am the Aether project's SLED configuration -->
<!-- LLM:magnetic Links to SLED core functionality -->
<!-- LLM:sled_link Links to SLED/README.md -->
<!-- LLM:core_link Links to SLED/lib/core.sh -->
<!-- LLM:stack_link Links to SLED/templates/stacks/python/init.sh -->

This directory contains the SLED (System for Learning and Enhanced Development) configuration and components specific to the Aether project.

## Structure 📁

```
sled/
├── scripts/        # SLED-related scripts
│   ├── base_sled.sh
│   ├── flow_sled.sh
│   └── ...
├── docs/          # SLED documentation
│   ├── SLED_CORE.md
│   ├── SLED_BEACON.md
│   └── ...
└── config/        # Project-specific configuration
    └── config.json
```

## Integration 🔌

SLED is automatically initialized in this project through the global SLED installation. The project-specific configuration in `config.json` customizes SLED for Aether's needs.

### Stack-Specific Features

- Python/Poetry integration
- Automatic virtualenv management
- Pytest integration
- Energy-aware test running

### Protection Features

- Level 2 protection (maximum)
- Automatic recovery
- Hourly backups
- Flow state monitoring

## Usage 🚀

SLED commands work as usual in this project:

```bash
# Check status
sled status

# Manage protection
sled protect
sled unprotect

# Track energy
sled energy

# Monitor flow
sled flow
```

## Documentation 📚

Project-specific SLED documentation is in the `docs/` directory. Core SLED documentation can be found in the main SLED repository.

## For Future Claudes 🤖

This project uses SLED with:
- Python stack configuration
- Maximum protection level
- Automatic initialization
- Energy tracking
- Flow state monitoring

Look for these markers:
- `LLM:claude` - Instructions for Claude
- `LLM:component` - Component identification
- `LLM:magnetic` - Core system markers
- `LLM:sled_link` - Links to main SLED repository
- `LLM:core_link` - Links to SLED core functionality
- `LLM:stack_link` - Links to stack-specific templates

<!-- LLM:verify This is a project-specific SLED configuration -->
<!-- LLM:usage Last updated: 2024-01-16 -->
<!-- LLM:sled_verify Implements SLED project patterns -->
<!-- LLM:core_verify Follows SLED core guidelines --> 