"""
Single Article SpikyPOV Extractor
"""
import asyncio
import logging
from dataclasses import dataclass
from typing import List, Optional
import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Article:
    """Represents a Substack article."""
    url: str
    title: str
    author: str
    content: str
    date: datetime

@dataclass
class SpikyPOV:
    """Represents an extracted SpikyPOV."""
    title: str
    consensus_view: str
    contrarian_view: str
    evidence: str
    source_url: str

class ArticleExtractor:
    """Extracts SpikyPOVs from a single Substack article."""
    
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_article(self, url: str) -> Article:
        """Fetch and parse a Substack article."""
        if not self.session:
            raise RuntimeError("Extractor not initialized. Use async with.")
            
        async with self.session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch article: {url}")
                
            html = await response.text()
            soup = BeautifulSoup(html, 'lxml')
            
            # Extract article content
            title = soup.find("h1").text.strip()
            author = soup.find("a", class_="subtitle-link").text.strip()
            content = soup.find("div", class_="body markup").get_text(separator="\n\n")
            date_str = soup.find("time")["datetime"]
            date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            
            return Article(
                url=url,
                title=title,
                author=author,
                content=content,
                date=date
            )

    async def extract_povs(self, article: Article) -> List[SpikyPOV]:
        """Extract SpikyPOVs from article content."""
        # For MVP, we'll use a simple approach to find contrarian statements
        # This is where we'd later integrate more sophisticated NLP
        povs = []
        paragraphs = article.content.split("\n\n")
        
        for i, para in enumerate(paragraphs):
            # Look for clear contrarian markers
            markers = [
                "contrary to popular belief",
                "most people think",
                "conventional wisdom",
                "commonly believed",
                "but in reality",
                "however, the truth is",
                "despite what many believe"
            ]
            
            for marker in markers:
                if marker.lower() in para.lower():
                    # Found potential SpikyPOV
                    context = "\n\n".join(paragraphs[max(0, i-1):min(len(paragraphs), i+2)])
                    
                    pov = SpikyPOV(
                        title=f"POV from: {article.title}",
                        consensus_view=self._extract_consensus(para),
                        contrarian_view=self._extract_contrarian(para),
                        evidence=context,
                        source_url=article.url
                    )
                    povs.append(pov)
                    break
        
        return povs

    def _extract_consensus(self, text: str) -> str:
        """Extract the consensus view from text."""
        # Simple extraction for MVP
        # Would be enhanced with NLP later
        lower_text = text.lower()
        
        for marker in ["most people think", "commonly believed", "conventional wisdom"]:
            if marker in lower_text:
                start_idx = lower_text.find(marker) + len(marker)
                end_idx = text.find(".", start_idx)
                if end_idx != -1:
                    return text[start_idx:end_idx].strip()
        
        return "Consensus view needs manual extraction"

    def _extract_contrarian(self, text: str) -> str:
        """Extract the contrarian view from text."""
        # Simple extraction for MVP
        lower_text = text.lower()
        
        for marker in ["but in reality", "however", "the truth is"]:
            if marker in lower_text:
                start_idx = lower_text.find(marker) + len(marker)
                end_idx = text.find(".", start_idx)
                if end_idx != -1:
                    return text[start_idx:end_idx].strip()
        
        return "Contrarian view needs manual extraction"

async def process_article(url: str, output_dir: Optional[Path] = None):
    """Process a single article and extract SpikyPOVs."""
    async with ArticleExtractor() as extractor:
        try:
            # Fetch and process article
            article = await extractor.fetch_article(url)
            povs = await extractor.extract_povs(article)
            
            # Prepare output
            result = {
                "article": {
                    "url": article.url,
                    "title": article.title,
                    "author": article.author,
                    "date": article.date.isoformat()
                },
                "povs": [
                    {
                        "title": pov.title,
                        "consensus_view": pov.consensus_view,
                        "contrarian_view": pov.contrarian_view,
                        "evidence": pov.evidence
                    }
                    for pov in povs
                ]
            }
            
            # Save if output directory provided
            if output_dir:
                output_dir = Path(output_dir)
                output_dir.mkdir(parents=True, exist_ok=True)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = output_dir / f"povs_{timestamp}.json"
                
                with open(output_file, 'w') as f:
                    json.dump(result, f, indent=2)
                logger.info(f"Saved results to {output_file}")
            
            # Print summary
            print(f"\n=== Article Analysis ===")
            print(f"Title: {article.title}")
            print(f"Author: {article.author}")
            print(f"Found {len(povs)} potential SpikyPOVs")
            
            for i, pov in enumerate(povs, 1):
                print(f"\n{i}. SpikyPOV:")
                print(f"   Consensus: {pov.consensus_view}")
                print(f"   Contrarian: {pov.contrarian_view}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing article: {e}")
            raise

async def main():
    """Example usage."""
    # Example article URL
    url = input("Enter Substack article URL: ").strip()
    
    try:
        await process_article(
            url,
            output_dir=Path("../../04-SPIKYPOVS/single_articles")
        )
    except Exception as e:
        print(f"Failed to process article: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 