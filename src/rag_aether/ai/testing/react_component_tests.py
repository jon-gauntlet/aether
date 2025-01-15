"""React component test suite for chat interface components."""
import pytest
from typing import Dict, Any, List
import json
from pathlib import Path
from playwright.async_api import async_playwright, Page

from ..quality_system import QualitySystem
from ..performance_system import PerformanceMonitor

class ReactComponentTests:
    """Tests for React frontend components."""
    
    def __init__(self):
        """Initialize test components."""
        self.quality = QualitySystem()
        self.monitor = PerformanceMonitor()
        
    async def setup(self):
        """Set up test environment."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch()
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        
    async def teardown(self):
        """Clean up test environment."""
        await self.browser.close()
        await self.playwright.stop()
        
    async def test_chat_input(self):
        """Test chat input component."""
        await self.page.goto("http://localhost:3000")
        
        # Test input visibility
        input_field = await self.page.wait_for_selector("[data-testid=chat-input]")
        assert await input_field.is_visible()
        
        # Test placeholder
        placeholder = await input_field.get_attribute("placeholder")
        assert "Type your message" in placeholder
        
        # Test character limit
        long_message = "a" * 2000
        await input_field.fill(long_message)
        actual_value = await input_field.input_value()
        assert len(actual_value) <= 1000, "Character limit not enforced"
        
        # Test send button state
        send_button = await self.page.wait_for_selector("[data-testid=send-button]")
        assert not await send_button.is_disabled()
        
        await input_field.fill("")
        assert await send_button.is_disabled(), "Send button enabled with empty input"
        
    async def test_message_display(self):
        """Test message display component."""
        await self.page.goto("http://localhost:3000")
        
        # Send test message
        message = "Test message display"
        await self.page.fill("[data-testid=chat-input]", message)
        await self.page.click("[data-testid=send-button]")
        
        # Verify message container
        message_container = await self.page.wait_for_selector(
            "[data-testid=message-container]"
        )
        assert await message_container.is_visible()
        
        # Verify user message
        user_message = await self.page.wait_for_selector(
            "[data-testid=user-message]"
        )
        assert message in await user_message.text_content()
        
        # Verify message timestamp
        timestamp = await self.page.wait_for_selector(
            "[data-testid=message-timestamp]"
        )
        assert await timestamp.is_visible()
        
    async def test_code_block(self):
        """Test code block component."""
        await self.page.goto("http://localhost:3000")
        
        # Send message with code
        message = "```python\nprint('hello')\n```"
        await self.page.fill("[data-testid=chat-input]", message)
        await self.page.click("[data-testid=send-button]")
        
        # Verify code block
        code_block = await self.page.wait_for_selector("pre code")
        assert await code_block.is_visible()
        
        # Verify syntax highlighting
        highlighted = await code_block.evaluate(
            "el => window.getComputedStyle(el).backgroundColor"
        )
        assert highlighted != "transparent"
        
        # Test copy button
        copy_button = await self.page.wait_for_selector(
            "[data-testid=copy-code-button]"
        )
        assert await copy_button.is_visible()
        
        await copy_button.click()
        tooltip = await self.page.wait_for_selector(
            "[data-testid=copy-tooltip]"
        )
        assert "Copied!" in await tooltip.text_content()
        
    async def test_error_components(self):
        """Test error display components."""
        await self.page.goto("http://localhost:3000")
        
        # Simulate network error
        await self.page.route("**/api/chat", lambda route: route.abort())
        
        # Send message
        await self.page.fill("[data-testid=chat-input]", "Test error")
        await self.page.click("[data-testid=send-button]")
        
        # Verify error display
        error_container = await self.page.wait_for_selector(
            "[data-testid=error-container]"
        )
        assert await error_container.is_visible()
        
        # Verify error icon
        error_icon = await self.page.wait_for_selector(
            "[data-testid=error-icon]"
        )
        assert await error_icon.is_visible()
        
        # Verify retry button styling
        retry_button = await self.page.wait_for_selector(
            "[data-testid=retry-button]"
        )
        button_color = await retry_button.evaluate(
            "el => window.getComputedStyle(el).backgroundColor"
        )
        assert button_color == "rgb(239, 68, 68)", "Incorrect error button styling"
        
    async def test_theme_switching(self):
        """Test theme switching component."""
        await self.page.goto("http://localhost:3000")
        
        # Get theme toggle
        theme_toggle = await self.page.wait_for_selector(
            "[data-testid=theme-toggle]"
        )
        
        # Test light theme
        await theme_toggle.click()
        background = await self.page.evaluate(
            "() => window.getComputedStyle(document.body).backgroundColor"
        )
        assert background == "rgb(255, 255, 255)", "Light theme not applied"
        
        # Test dark theme
        await theme_toggle.click()
        background = await self.page.evaluate(
            "() => window.getComputedStyle(document.body).backgroundColor"
        )
        assert background == "rgb(17, 24, 39)", "Dark theme not applied"
        
# Test fixtures
@pytest.fixture
async def react_tests():
    """Create React component test instance."""
    tests = ReactComponentTests()
    await tests.setup()
    yield tests
    await tests.teardown()

# Test cases
@pytest.mark.asyncio
async def test_input(react_tests):
    """Test chat input component."""
    await react_tests.test_chat_input()
    
@pytest.mark.asyncio
async def test_messages(react_tests):
    """Test message display component."""
    await react_tests.test_message_display()
    
@pytest.mark.asyncio
async def test_code(react_tests):
    """Test code block component."""
    await react_tests.test_code_block()
    
@pytest.mark.asyncio
async def test_errors(react_tests):
    """Test error components."""
    await react_tests.test_error_components()
    
@pytest.mark.asyncio
async def test_theme(react_tests):
    """Test theme switching."""
    await react_tests.test_theme_switching() 