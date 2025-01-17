"""End-to-end tests for the RAG system."""
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
from playwright.async_api import async_playwright, Browser, Page

class E2ETests:
    """End-to-end tests for the system."""
    
    def __init__(self):
        """Initialize E2E tests."""
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.logger = logging.getLogger(__name__)
        
    async def setup(self):
        """Set up test environment."""
        try:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch()
            self.page = await self.browser.new_page()
            self.logger.info("Browser initialized successfully")
        except Exception as e:
            self.logger.error(f"Error initializing browser: {str(e)}")
            if self.browser:
                await self.browser.close()
            raise
        
    async def teardown(self):
        """Clean up test environment."""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all E2E tests."""
        results = []
        
        try:
            # Test basic page load
            await self.page.goto('http://localhost:3000')
            title = await self.page.title()
            results.append({
                'name': 'page_load',
                'success': 'RAG System' in title,
                'details': {
                    'title': title
                }
            })
            
            # Test search functionality
            search_input = await self.page.get_by_placeholder('Enter your query')
            await search_input.fill('test query')
            await search_input.press('Enter')
            
            # Wait for results
            results_container = await self.page.wait_for_selector('.search-results')
            results_text = await results_container.inner_text()
            
            results.append({
                'name': 'search',
                'success': len(results_text) > 0,
                'details': {
                    'results_length': len(results_text)
                }
            })
            
        except Exception as e:
            self.logger.error(f"Error in E2E tests: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'results': results
            }
            
        return {
            'success': all(r['success'] for r in results),
            'results': results
        } 