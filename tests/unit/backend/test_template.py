"""
Test Template

This template demonstrates the simplified testing approach for Aether.
Follow this structure for consistent and maintainable tests.
"""

import pytest
from typing import Generator

# Fixtures with clear scope and purpose
@pytest.fixture(scope="function")
def sample_data() -> dict:
    """Provide test data in a simple, reusable way."""
    return {
        "id": "test-1",
        "value": "sample"
    }

@pytest.fixture(scope="module")
def mock_service() -> Generator:
    """Example of a service fixture with proper setup/teardown."""
    # Setup
    service = {"status": "ready"}
    yield service
    # Teardown - cleanup is important
    service.clear()

# Group related tests in classes
class TestFeature:
    """Tests for a specific feature or component."""
    
    @pytest.mark.unit
    def test_basic_functionality(self, sample_data: dict) -> None:
        """
        Simple unit test demonstrating the testing pattern.
        
        Pattern:
        1. Arrange - setup test data
        2. Act - perform the action
        3. Assert - verify the result
        """
        # Arrange
        expected = "sample"
        
        # Act
        result = sample_data["value"]
        
        # Assert
        assert result == expected, f"Expected {expected}, got {result}"
    
    @pytest.mark.integration
    def test_integration_flow(self, mock_service: dict) -> None:
        """Example of an integration test with external dependencies."""
        assert mock_service["status"] == "ready"

    @pytest.mark.parametrize("input_val,expected", [
        ("test1", True),
        ("test2", True),
        ("invalid", False)
    ])
    def test_multiple_cases(self, input_val: str, expected: bool) -> None:
        """Demonstrate testing multiple cases efficiently."""
        result = input_val.startswith("test")
        assert result == expected

# Standalone test function for simple cases
@pytest.mark.unit
def test_simple_case() -> None:
    """Single test function when grouping isn't needed."""
    assert True, "Basic sanity check" 