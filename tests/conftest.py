"""Test configuration and fixtures."""
import pytest
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

def pytest_configure(config):
    """Configure pytest."""
    config.option.verbose = 2  # Set verbosity directly on config 