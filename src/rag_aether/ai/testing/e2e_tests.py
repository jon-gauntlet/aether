"""End-to-end test suite for RAG system with React frontend integration."""
import pytest
import asyncio
from typing import Dict, Any, List
from pathlib import Path
import aiohttp
import json
from playwright.async_api import async_playwright
import numpy as np

from ..hybrid_search import HybridSearcher
from ..quality_system import QualitySystem
from ..performance_system import PerformanceMonitor

class E2ETests:
    """End-to-end tests for RAG system with React frontend."""
    
    def __init__(self):
        """Initialize test components."""
        self.monitor = PerformanceMonitor()
        self.quality = QualitySystem()
        self.searcher = HybridSearcher()
        
    async def setup(self):
        """Set up test environment."""
        # Initialize browser for frontend testing
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch()
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        
        # Initialize backend components
        await self.searcher.initialize()
        await self.quality.initialize()
        
    async def teardown(self):
        """Clean up test environment."""
        await self.browser.close()
        await self.playwright.stop()
        
    async def test_chat_interaction(self):
        """Test complete chat interaction flow."""
        # Navigate to chat interface
        await self.page.goto("http://localhost:3000")
        
        # Send test message
        message = "What is machine learning?"
        await self.page.fill("[data-testid=chat-input]", message)
        await self.page.click("[data-testid=send-button]")
        
        # Verify RAG response
        response = await self.page.wait_for_selector("[data-testid=ai-response]")
        response_text = await response.text_content()
        
        # Validate response quality
        quality_score = await self.quality.evaluate_response(
            query=message,
            response=response_text
        )
        assert quality_score > 0.8, "Response quality below threshold"
        
        # Verify streaming behavior
        typing_indicator = await self.page.wait_for_selector(
            "[data-testid=typing-indicator]"
        )
        assert await typing_indicator.is_visible()
        
    async def test_context_preservation(self):
        """Test context preservation across messages."""
        await self.page.goto("http://localhost:3000")
        
        # Multi-turn conversation
        messages = [
            "What is deep learning?",
            "How does it compare to traditional machine learning?",
            "Can you give an example?"
        ]
        
        prev_response = None
        for msg in messages:
            await self.page.fill("[data-testid=chat-input]", msg)
            await self.page.click("[data-testid=send-button]")
            
            response = await self.page.wait_for_selector("[data-testid=ai-response]")
            current_response = await response.text_content()
            
            if prev_response:
                # Verify context preservation
                context_score = await self.quality.evaluate_context_preservation(
                    prev_response=prev_response,
                    current_response=current_response
                )
                assert context_score > 0.7, "Context preservation below threshold"
            
            prev_response = current_response
            
    async def test_error_handling(self):
        """Test error handling and recovery."""
        await self.page.goto("http://localhost:3000")
        
        # Simulate network error
        await self.page.route("**/api/chat", lambda route: route.abort())
        
        # Send message
        await self.page.fill("[data-testid=chat-input]", "Test message")
        await self.page.click("[data-testid=send-button]")
        
        # Verify error handling
        error_message = await self.page.wait_for_selector("[data-testid=error-message]")
        assert await error_message.is_visible()
        
        # Verify retry mechanism
        retry_button = await self.page.wait_for_selector("[data-testid=retry-button]")
        assert await retry_button.is_visible()
        
    async def test_performance_metrics(self):
        """Test performance metrics during chat interaction."""
        await self.page.goto("http://localhost:3000")
        
        # Enable performance monitoring
        client_metrics = await self.page.evaluate("""
            () => {
                const metrics = {};
                performance.mark('chat-start');
                return metrics;
            }
        """)
        
        # Send test message
        await self.page.fill("[data-testid=chat-input]", "Test performance")
        await self.page.click("[data-testid=send-button]")
        
        # Collect performance metrics
        metrics = await self.monitor.collect_metrics()
        
        # Validate metrics
        assert metrics['response_time'] < 2.0, "Response time above threshold"
        assert metrics['memory_usage'] < 512, "Memory usage above threshold"
        
# Test fixtures
@pytest.fixture
async def e2e_tests():
    """Create and set up E2E test instance."""
    tests = E2ETests()
    await tests.setup()
    yield tests
    await tests.teardown()

# Test cases
@pytest.mark.asyncio
async def test_chat_flow(e2e_tests):
    """Test complete chat interaction flow."""
    await e2e_tests.test_chat_interaction()
    
@pytest.mark.asyncio
async def test_context(e2e_tests):
    """Test context preservation."""
    await e2e_tests.test_context_preservation()
    
@pytest.mark.asyncio
async def test_errors(e2e_tests):
    """Test error handling."""
    await e2e_tests.test_error_handling()
    
@pytest.mark.asyncio
async def test_performance(e2e_tests):
    """Test performance metrics."""
    await e2e_tests.test_performance_metrics() 