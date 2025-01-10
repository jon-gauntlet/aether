# AI System Evolution Session Bootstrap

This document is designed to help AI assistants quickly understand and navigate the system. Follow these steps to effectively engage with the project.

## Quick System Overview

1. **Infrastructure Components**
   - Invisible Infrastructure (core system services)
   - Gauntlet AI Integration (metrics & optimization)
   - Focus Tools (productivity optimization)
   - Context Management System

2. **Key Directories**
   ```
   /home/jon/
   ├── .config/cursor/contexts/     # Context storage
   ├── .local/share/
   │   ├── gauntlet/               # Metrics & state
   │   └── cursor/
   │       ├── models/             # AI models
   │       └── contexts/           # Active contexts
   ├── scripts/cursor/             # System scripts
   └── ai_system_evolution/        # This project
   ```

## Service Status Check

Run these commands to verify system health:
```bash
systemctl --user status cursor-ai.slice
systemctl --user status gauntlet-optimizer-ai.service
systemctl --user status context-crystallizer.service
```

## Metrics & Monitoring

1. **AI Metrics Location**
   ```
   /home/jon/.local/share/gauntlet/ai/metrics.json
   /home/jon/.local/share/gauntlet/ai/predictions/
   ```

2. **Context Quality**
   ```
   /home/jon/.local/share/cursor/contexts/
   /home/jon/.local/state/cursor/contexts/
   ```

## Integration Points

1. **Context Management**
   - Context crystallization
   - Quality scoring
   - Preservation directives

2. **Resource Optimization**
   - Memory allocation
   - CPU scheduling
   - Model management

3. **Focus Enhancement**
   - Flow state detection
   - Deep work optimization
   - Interruption management

## Current Development Phase

We are currently in Phase 1 of the Gauntlet AI Integration:
- Metrics collection is active
- Basic prediction system is operational
- Resource optimization is running
- Context management is being enhanced

## Next Actions

1. Review [GAUNTLET_AI_INTEGRATION.md](docs/integration/GAUNTLET_AI_INTEGRATION.md)
2. Check metrics collection in `/home/jon/.local/share/gauntlet/ai/`
3. Analyze context quality in `/home/jon/.local/share/cursor/contexts/`
4. Begin pattern recognition implementation

## System Constraints

- Memory: 15GB RAM + 16GB Swap
- CPU: 12 cores (i7-1355U)
- AI Models: Max 4GB allocation
- Context Cache: Max 2GB

## Best Practices

1. **Resource Management**
   - Monitor memory usage
   - Check swap utilization
   - Verify context sizes
   - Track model loading

2. **Context Handling**
   - Preserve active contexts
   - Monitor quality scores
   - Optimize loading times
   - Manage relationships

3. **Integration Development**
   - Follow phase guidelines
   - Test predictions
   - Validate metrics
   - Document changes

## Troubleshooting

1. **Service Issues**
   ```bash
   journalctl --user -u gauntlet-optimizer-ai.service -n 50
   journalctl --user -u context-crystallizer.service -n 50
   ```

2. **Metrics Problems**
   - Check JSON validity
   - Verify file permissions
   - Monitor disk space
   - Review log outputs

## Remember

- The system is designed for autonomous operation
- Context preservation is critical
- Resource optimization is continuous
- Integration should enhance, not replace 