"""
Autonomic management system for AI system evolution.

This package provides components for autonomous system evolution and optimization
while maintaining system integrity and accessibility.

Components:
- AutonomicManager: Main orchestrator for system evolution
- AutonomicConfig: Configuration for autonomic management
"""

from .manager import AutonomicManager, AutonomicConfig

__all__ = ['AutonomicManager', 'AutonomicConfig']
__version__ = '0.1.0' 