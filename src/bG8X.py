cc"""
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
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    async with aiohttp.ClientSession(headers=headers) as session:
        logger.info(f"Fetching URL: {url}")
        async with session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch article: {url} (Status: {response.status})")
            
            html = await response.text()
            logger.info(f"Retrieved HTML: {len(html)} bytes")
            soup = BeautifulSoup(html, 'lxml')
            
            # Get main content
            content_div = (
                soup.find("div", class_="body markup") or
                soup.find("div", class_="post-content") or
                soup.find("div", {"data-component-name": "PostContent"}) or
                soup.find("div", class_="available-content")
            )
            
            if not content_div:
                logger.error("Could not find content div with known classes")
                # Log available classes for debugging
                all_divs = soup.find_all("div", class_=True)
                classes = set(cls for div in all_divs for cls in div.get("class", []))
                logger.info(f"Available div classes: {classes}")
                
                # Try finding by article tag
                article = soup.find("article")
                if article:
                    logger.info("Found article tag, using its content")
                    content_div = article
                else:
                    raise ValueError("Could not find article content")
            
            logger.info(f"Found content div with class: {content_div.get('class', [])}")
            
            # Extract text, preserving structure
            content = ""
            for elem in content_div.find_all(['p', 'h2', 'h3', 'blockquote', 'li']):
                text = elem.get_text(strip=True)
                if text:
                    content += text + "\n\n"
            
            logger.info(f"Extracted {len(content)} characters of text")
            logger.info(f"First 200 chars: {content[:200]}")
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