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
import re

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
    domains: List[str] = None

class ArticleExtractor:
    """Extracts SpikyPOVs from a single Substack article."""
    
    def __init__(self):
        self.session = None
        # Enhanced markers for this style of writing
        self.consensus_markers = [
            "most people think",
            "commonly believed",
            "conventional wisdom",
            "today, preachers frequently",
            "popular belief",
            "it's delusional to claim that",
            "these truths are politically unpopular",
            "politicians pretend",
            "claim that",
            "superficial",
            "scapegoating",
            "it's typical of",
            "politics is downstream",
            "it provides a",
            "it feels righteous",
        ]
        
        self.contrarian_markers = [
            "but in reality",
            "however, the truth is",
            "according to the scriptures",
            "historical evidence",
            "statistical data invalidates",
            "in reality",
            "the larger problem is",
            "the fundamental truth is",
            "but the question is never asked",
            "the question is never asked",
            "nearly 70% of",
            "these trends are worsening",
            "the end of cheap energy",
            "there is a fundamental",
        ]
        
        self.domain_markers = {
            "theology": ["scripture", "christian", "church", "god", "biblical", "religion", "faith"],
            "philosophy": ["meaning", "truth", "reality", "civilization", "authentic", "fundamental"],
            "culture": ["society", "modern", "cultural", "social", "community", "civilization"],
            "politics": ["political", "conservative", "liberal", "policy", "economics", "bureaucratic"],
            "gender": ["men", "women", "masculine", "feminine", "marriage", "dating", "romance"]
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _clean_text(self, text: str) -> str:
        """Clean extracted text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove quotes and ellipsis
        text = text.replace('"', '').replace('"', '').replace('…', '...')
        # Remove leading punctuation
        text = re.sub(r'^[,.;]\s*', '', text)
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:]
        return text

    def _is_similar(self, text1: str, text2: str, threshold: float = 0.7) -> bool:
        """Check if two texts are similar using character-level comparison."""
        if not text1 or not text2:
            return False
            
        # Convert to sets of words
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union > threshold if union > 0 else False

    def _infer_domains(self, text: str) -> List[str]:
        """Infer domains from text content."""
        text_lower = text.lower()
        domains = set()
        
        for domain, markers in self.domain_markers.items():
            if any(marker in text_lower for marker in markers):
                domains.add(domain)
                
        return list(domains) if domains else ["philosophy"]

    async def fetch_article(self, url: str) -> Article:
        """Fetch and parse a Substack article."""
        if not self.session:
            raise RuntimeError("Extractor not initialized. Use async with.")
            
        async with self.session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch article: {url}")
                
            html = await response.text()
            soup = BeautifulSoup(html, 'lxml')
            
            # Extract article content - handle different possible structures
            title_elem = soup.find("h1", class_="post-title") or soup.find("h1")
            if not title_elem:
                raise ValueError("Could not find article title")
            title = title_elem.text.strip()
            
            # Try different ways to find author
            author_elem = (
                soup.find("a", class_="subtitle-link") or 
                soup.find("span", class_="author-name") or
                soup.find("a", class_="author-name")
            )
            author = author_elem.text.strip() if author_elem else "Unknown Author"
            
            # Try different content div classes
            content_div = (
                soup.find("div", class_="body markup") or
                soup.find("div", class_="post-content") or
                soup.find("div", {"data-component-name": "PostContent"})
            )
            
            if not content_div:
                raise ValueError("Could not find article content")
                
            content = ""
            for elem in content_div.find_all(['p', 'h2', 'h3', 'blockquote']):
                text = elem.get_text(strip=True)
                if text:
                    content += text + "\n\n"
            
            # Try different date formats
            date_elem = soup.find("time")
            if date_elem and date_elem.get("datetime"):
                date_str = date_elem["datetime"]
                date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            else:
                date = datetime.now()
            
            return Article(
                url=url,
                title=title,
                author=author,
                content=content,
                date=date
            )

    async def extract_povs(self, article: Article) -> List[SpikyPOV]:
        """Extract SpikyPOVs from article content."""
        povs = []
        seen_views = set()  # Track unique views
        paragraphs = [p for p in article.content.split("\n\n") if p.strip()]
        
        for i, para in enumerate(paragraphs):
            # Skip short paragraphs
            if len(para.split()) < 10:
                continue
                
            # Look for consensus markers
            for c_marker in self.consensus_markers:
                if c_marker.lower() in para.lower():
                    # Found potential consensus view
                    # Look ahead for contrarian view
                    contrarian_view = None
                    evidence = para
                    
                    # Look in next few paragraphs for contrarian view
                    for j in range(i, min(i + 4, len(paragraphs))):
                        next_para = paragraphs[j]
                        for t_marker in self.contrarian_markers:
                            if t_marker.lower() in next_para.lower():
                                contrarian_view = next_para
                                evidence = "\n\n".join(paragraphs[i:j+1])
                                break
                        if contrarian_view:
                            break
                    
                    if contrarian_view:
                        consensus = self._clean_text(self._extract_consensus(para))
                        contrarian = self._clean_text(self._extract_contrarian(contrarian_view))
                        
                        # Skip if we've seen a similar view
                        is_duplicate = False
                        for seen_consensus, seen_contrarian in seen_views:
                            if (self._is_similar(consensus, seen_consensus) and 
                                self._is_similar(contrarian, seen_contrarian)):
                                is_duplicate = True
                                break
                                
                        # Only add if both views are meaningful and not duplicates
                        if (len(consensus) > 20 and len(contrarian) > 20 and 
                            not is_duplicate):
                            seen_views.add((consensus, contrarian))
                            domains = self._infer_domains(evidence)
                            pov = SpikyPOV(
                                title=f"POV from: {article.title}",
                                consensus_view=consensus,
                                contrarian_view=contrarian,
                                evidence=evidence,
                                source_url=article.url,
                                domains=domains
                            )
                            povs.append(pov)
                    break
        
        return povs

    def _extract_consensus(self, text: str) -> str:
        """Extract the consensus view from text."""
        lower_text = text.lower()
        
        for marker in self.consensus_markers:
            if marker in lower_text:
                start_idx = lower_text.find(marker) + len(marker)
                end_idx = text.find(".", start_idx)
                if end_idx != -1:
                    return text[start_idx:end_idx].strip()
        
        # If no clear marker, return the whole paragraph
        return text.split(".")[0].strip()

    def _extract_contrarian(self, text: str) -> str:
        """Extract the contrarian view from text."""
        lower_text = text.lower()
        
        for marker in self.contrarian_markers:
            if marker in lower_text:
                start_idx = lower_text.find(marker) + len(marker)
                end_idx = text.find(".", start_idx)
                if end_idx != -1:
                    return text[start_idx:end_idx].strip()
        
        # If no clear marker, return the whole paragraph
        return text.split(".")[0].strip()

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
                        "evidence": pov.evidence,
                        "domains": pov.domains
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
                print(f"   Domains: {', '.join(pov.domains)}")
                print(f"   Consensus: {pov.consensus_view}")
                print(f"   Contrarian: {pov.contrarian_view}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing article: {e}")
            raise

async def main():
    """Example usage."""
    url = "https://billionairepsycho.substack.com/p/pygmalion-and-the-anime-girl"
    
    try:
        await process_article(
            url,
            output_dir=Path("../../04-SPIKYPOVS/single_articles")
        )
    except Exception as e:
        print(f"Failed to process article: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 