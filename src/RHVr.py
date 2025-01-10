"""
SpikyPOV Extraction Pipeline
"""
import asyncio
import logging
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
from .substack_client import SubstackClient, Article
from .orthodox_validator import OrthodoxValidator, ValidationResult
from tenacity import retry, wait_exponential, stop_after_attempt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ExtractedPOV:
    """A SpikyPOV extracted from an article."""
    title: str
    consensus_view: str
    contrarian_view: str
    evidence: str
    source_article: Article
    validation: Optional[ValidationResult] = None
    domains: List[str] = None

class POVExtractor:
    """Extracts and validates SpikyPOVs from Substack articles."""
    
    def __init__(self):
        self.substack = SubstackClient()
        self.validator = OrthodoxValidator()
        
    async def __aenter__(self):
        await self.substack.__aenter__()
        await self.validator.__aenter__()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.substack.__aexit__(exc_type, exc_val, exc_tb)
        await self.validator.__aexit__(exc_type, exc_val, exc_tb)

    @retry(wait=wait_exponential(multiplier=1, min=4, max=10),
           stop=stop_after_attempt(3))
    async def extract_povs_from_writer(self, username: str) -> List[ExtractedPOV]:
        """Extract all SpikyPOVs from a writer's articles."""
        logger.info(f"Fetching articles for {username}")
        
        # Get writer and articles
        writer = await self.substack.fetch_writer(username)
        articles = await self.substack.fetch_articles(writer)
        
        logger.info(f"Found {len(articles)} articles")
        
        # Extract POVs from each article
        all_povs = []
        for article in articles:
            try:
                povs = await self.extract_povs_from_article(article)
                all_povs.extend(povs)
                logger.info(f"Extracted {len(povs)} POVs from {article.title}")
            except Exception as e:
                logger.error(f"Error processing article {article.title}: {e}")
        
        return all_povs

    async def extract_povs_from_article(self, article: Article) -> List[ExtractedPOV]:
        """Extract SpikyPOVs from a single article."""
        # Use the article's content to identify potential POVs
        povs = await self.substack.extract_povs(article)
        
        # Validate each POV
        validated_povs = []
        for pov in povs:
            try:
                # Determine domains based on content
                domains = self._infer_domains(pov, article)
                
                # Create ExtractedPOV
                extracted = ExtractedPOV(
                    title=pov.title,
                    consensus_view=pov.consensus_view,
                    contrarian_view=pov.contrarian_view,
                    evidence=pov.evidence,
                    source_article=article,
                    domains=domains
                )
                
                # Validate against Orthodox teaching
                validation = await self.validator.validate_pov(pov)
                extracted.validation = validation
                
                validated_povs.append(extracted)
                
            except Exception as e:
                logger.error(f"Error validating POV {pov.title}: {e}")
                
        return validated_povs

    def _infer_domains(self, pov: 'SpikyPOV', article: Article) -> List[str]:
        """Infer relevant Orthodox domains for a POV."""
        domains = set()
        
        # Add domains from article if available
        if article.domains:
            domains.update(article.domains)
            
        # TODO: Implement more sophisticated domain inference
        # For now, just ensure we have at least one domain
        if not domains:
            domains.add("philosophy")  # Default domain
            
        return list(domains)

async def main():
    """Example usage."""
    writer = "default_friend"  # Example Substack writer
    
    async with POVExtractor() as extractor:
        try:
            povs = await extractor.extract_povs_from_writer(writer)
            
            print(f"\nExtracted {len(povs)} SpikyPOVs from {writer}")
            for i, pov in enumerate(povs, 1):
                print(f"\n{i}. {pov.title}")
                print(f"   Consensus: {pov.consensus_view}")
                print(f"   Contrarian: {pov.contrarian_view}")
                print(f"   From: {pov.source_article.title}")
                if pov.validation:
                    print(f"   Validation: {pov.validation.status.value}")
                    if pov.validation.supporting_sources:
                        print("   Orthodox Sources:")
                        for source in pov.validation.supporting_sources[:2]:
                            print(f"   - {source.title}")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 