"""
Process Substack Article
Extract SpikyPOVs from a Substack article and save results.
"""
import asyncio
import logging
from pathlib import Path
import aiohttp
from bs4 import BeautifulSoup
from spikypov_extractor import SpikyPOVExtractor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fetch_article_content(url: str) -> str:
    """Fetch and extract article content from Substack."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch article: {url}")
            
            html = await response.text()
            soup = BeautifulSoup(html, 'lxml')
            
            # Get main content
            content_div = (
                soup.find("div", class_="body markup") or
                soup.find("div", class_="post-content") or
                soup.find("div", {"data-component-name": "PostContent"}) or
                soup.find("div", class_="available-content")
            )
            
            if not content_div:
                raise ValueError("Could not find article content")
            
            # Extract text, preserving structure
            content = ""
            for elem in content_div.find_all(['p', 'h2', 'h3', 'blockquote', 'li']):
                text = elem.get_text(strip=True)
                if text:
                    content += text + "\n\n"
            
            return content

async def main():
    """Process a Substack article and extract SpikyPOVs."""
    # Article URL
    url = "https://billionairepsycho.substack.com/p/pygmalion-and-the-anime-girl"
    
    try:
        # Fetch article content
        logger.info(f"Fetching article from {url}")
        content = await fetch_article_content(url)
        logger.info(f"Retrieved {len(content)} characters of content")
        
        # Extract SpikyPOVs
        extractor = SpikyPOVExtractor(
            min_confidence=0.6,  # Require strong confidence
            min_divergence=0.6   # Require significant divergence
        )
        
        logger.info("Extracting SpikyPOVs...")
        spiky_povs = await extractor.extract_spikypovs(content)
        
        # Save results
        output_dir = Path("../../04-SPIKYPOVS/articles/pygmalion")
        output_file = extractor.save_spikypovs(spiky_povs, output_dir, url)
        
        # Print summary
        print(f"\n=== Article Analysis Complete ===")
        print(f"Found {len(spiky_povs)} SpikyPOVs")
        print(f"Results saved to: {output_file}")
        
        print("\nTop SpikyPOVs by Confidence + Divergence:")
        # Sort by combined score
        sorted_povs = sorted(
            spiky_povs,
            key=lambda p: p.confidence + p.divergence,
            reverse=True
        )
        
        for i, pov in enumerate(sorted_povs[:5], 1):  # Show top 5
            print(f"\n{i}. Combined Score: {pov.confidence + pov.divergence:.2f}")
            print(str(pov))
        
    except Exception as e:
        logger.error(f"Error processing article: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 