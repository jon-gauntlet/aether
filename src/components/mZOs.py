"""
Orthodox Validation Component for BrainLift Project
"""
from dataclasses import dataclass
from typing import List, Optional, Dict
import aiohttp
from bs4 import BeautifulSoup
import asyncio
from enum import Enum
from .patristic_parser import PatristicParser, PatristicArticle
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

class ValidationStatus(Enum):
    ALIGNED = "aligned"
    PARTIAL = "partial"
    REJECTED = "rejected"
    UNCLEAR = "needs_investigation"

@dataclass
class PatristicSource:
    title: str
    url: str
    author: str
    content: str
    categories: List[str]

@dataclass
class ValidationResult:
    status: ValidationStatus
    explanation: str
    supporting_sources: List[PatristicSource]
    recommended_modifications: Optional[str] = None

class OrthodoxValidator:
    """Validates SpikyPOVs against Orthodox teaching using Patristic Faith resources."""
    
    def __init__(self):
        self.base_url = "https://patristicfaith.com"
        self.categories = {
            "theology": "/theology",
            "spirituality": "/spirituality",
            "apologetics": "/apologetics",
            "philosophy": "/philosophy"
        }
        self.session = None
        self.parser = PatristicParser()
        # Initialize sentence transformer for semantic search
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.articles_cache = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_category_articles(self, category: str) -> List[PatristicSource]:
        """Fetch articles from a specific category."""
        if not self.session:
            raise RuntimeError("Validator not initialized. Use async with.")
            
        url = f"{self.base_url}{self.categories[category]}"
        articles = []
        
        async with self.session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch category: {category}")
                
            soup = BeautifulSoup(await response.text(), 'lxml')
            article_previews = self.parser.parse_category_page(soup)
            
            # Fetch full articles
            for preview in article_previews:
                async with self.session.get(preview["url"]) as article_response:
                    if article_response.status == 200:
                        article_soup = BeautifulSoup(await article_response.text(), 'lxml')
                        article = self.parser.parse_article_content(article_soup)
                        if article:
                            articles.append(PatristicSource(
                                title=article.title,
                                url=article.url,
                                author=article.author,
                                content=article.content,
                                categories=article.categories
                            ))
            
            return articles

    def build_search_index(self, articles: List[PatristicSource]):
        """Build FAISS index for semantic search."""
        self.articles_cache = articles
        texts = [f"{a.title} {a.content}" for a in articles]
        embeddings = self.model.encode(texts)
        
        # Initialize FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings.astype('float32'))

    async def find_relevant_sources(self, query: str, k: int = 5) -> List[PatristicSource]:
        """Find most relevant sources for a query using semantic search."""
        if not self.index:
            raise RuntimeError("Search index not built. Call build_search_index first.")
            
        # Get query embedding
        query_embedding = self.model.encode([query])
        
        # Search
        D, I = self.index.search(query_embedding.astype('float32'), k)
        
        # Return relevant articles
        return [self.articles_cache[i] for i in I[0]]

    async def validate_pov(self, pov: 'SpikyPOV') -> ValidationResult:
        """Validate a SpikyPOV against Orthodox teaching."""
        # Fetch all relevant articles
        all_articles = []
        for domain in pov.domains:
            if domain in self.categories:
                articles = await self.fetch_category_articles(domain)
                all_articles.extend(articles)
        
        # Build search index
        self.build_search_index(all_articles)
        
        # Find relevant sources
        query = f"{pov.title} {pov.consensus_view} {pov.contrarian_view}"
        relevant_sources = await self.find_relevant_sources(query)
        
        # TODO: Implement more sophisticated validation logic
        # For now, just check if we found supporting sources
        if relevant_sources:
            return ValidationResult(
                status=ValidationStatus.PARTIAL,
                explanation="Found potentially relevant sources for validation",
                supporting_sources=relevant_sources
            )
        
        return ValidationResult(
            status=ValidationStatus.UNCLEAR,
            explanation="No relevant sources found for validation",
            supporting_sources=[]
        )

    async def suggest_modifications(self, pov: 'SpikyPOV', result: ValidationResult) -> str:
        """Suggest modifications to align POV with Orthodox teaching."""
        if result.status == ValidationStatus.ALIGNED:
            return "No modifications needed"
            
        if not result.supporting_sources:
            return "Unable to suggest modifications without relevant sources"
            
        # TODO: Implement more sophisticated modification suggestions
        suggestions = []
        for source in result.supporting_sources:
            suggestions.append(f"Consider insights from '{source.title}' by {source.author}")
            
        return "\n".join(suggestions)

class OrthodoxDomains:
    """Common Orthodox domains for categorization."""
    
    THEOLOGY = "theology"
    SPIRITUALITY = "spirituality"
    APOLOGETICS = "apologetics"
    PHILOSOPHY = "philosophy"
    LIFESTYLE = "christian_lifestyle"
    
    @staticmethod
    def all_domains() -> List[str]:
        return [
            OrthodoxDomains.THEOLOGY,
            OrthodoxDomains.SPIRITUALITY,
            OrthodoxDomains.APOLOGETICS,
            OrthodoxDomains.PHILOSOPHY,
            OrthodoxDomains.LIFESTYLE
        ]

async def main():
    """Example usage."""
    from dataclasses import dataclass
    
    @dataclass
    class SpikyPOV:
        title: str
        consensus_view: str
        contrarian_view: str
        domains: List[str]
    
    test_pov = SpikyPOV(
        title="Technology should serve tradition",
        consensus_view="Technology drives progress and tradition must adapt",
        contrarian_view="Technology must be subordinate to and guided by tradition",
        domains=["theology", "philosophy"]
    )
    
    async with OrthodoxValidator() as validator:
        try:
            result = await validator.validate_pov(test_pov)
            print(f"Validation status: {result.status}")
            print(f"Explanation: {result.explanation}")
            print("\nSupporting sources:")
            for source in result.supporting_sources:
                print(f"- {source.title} by {source.author}")
            
            if result.status != ValidationStatus.ALIGNED:
                mods = await validator.suggest_modifications(test_pov, result)
                print(f"\nSuggested modifications:\n{mods}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 