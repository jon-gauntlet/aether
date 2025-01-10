"""Test configuration and fixtures."""

import sys
from unittest.mock import MagicMock

# Mock external dependencies
MOCK_MODULES = ['llama_cpp']
for mod_name in MOCK_MODULES:
    sys.modules[mod_name] = MagicMock()
    
# Configure mock behavior
sys.modules['llama_cpp'].Llama = MagicMock() 