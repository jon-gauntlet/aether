"""
Context management system for pattern learning and evolution.

This package provides components for managing system contexts, learning patterns,
and synthesizing higher-level patterns from observations.

Components:
- ContextManager: Manages system contexts and their lifecycle
- PatternLearner: Learns patterns from system behavior
- PatternSynthesizer: Synthesizes higher-level patterns
- Pattern: Data class representing a learned pattern
- Context: Data class representing a system context
"""

from .manager import ContextManager, Context, ContextConfig
from .learner import PatternLearner, Pattern, LearnerConfig
from .synthesizer import PatternSynthesizer, SynthesizerConfig
from .validator import PatternValidator, ValidationConfig
from .store import PatternStore

__all__ = [
    'ContextManager',
    'Context',
    'ContextConfig',
    'PatternLearner',
    'Pattern',
    'LearnerConfig',
    'PatternSynthesizer',
    'SynthesizerConfig',
    'PatternValidator',
    'ValidationConfig',
    'PatternStore'
]
__version__ = '0.1.0'
