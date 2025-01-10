"""
Consensus Checker for SpikyPOV Analysis
Validates positions against conventional wisdom using LLM defaults and web sources.
"""
from dataclasses import dataclass
from typing import List, Optional
import logging
import aiohttp
import asyncio
from bs4 import BeautifulSoup
from position_extractor import Position
import re
from urllib.parse import quote_plus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConsensusCheck:
    """Result of checking a position against conventional wisdom."""
    position: Position
    consensus_view: str
    divergence_score: float  # 0-1 score of how much it differs
    sources: List[str]  # Where consensus view was found
    explanation: Optional[str] = None  # Why this is considered divergent

class ConsensusChecker:
    """Checks positions against conventional wisdom."""
    
    def __init__(self):
        self.session = None
        
        # Sources for consensus views
        self.fact_check_domains = [
            "snopes.com",
            "factcheck.org",
            "politifact.com",
            "reuters.com/fact-check",
            "apnews.com/hub/ap-fact-check"
        ]
        
        self.institutional_domains = [
            "edu",
            "gov",
            "org",
            "wikipedia.org",
            "britannica.com",
            "who.int",
            "worldbank.org",
            "un.org"
        ]
        
        # Terms that indicate consensus
        self.consensus_indicators = [
            "generally accepted",
            "widely believed",
            "commonly understood",
            "scientific consensus",
            "experts agree",
            "research shows",
            "studies indicate",
            "evidence suggests",
            "according to",
            "established fact",
            "conventional wisdom"
        ]
        
        # Terms that indicate divergence
        self.divergence_indicators = [
            "controversial",
            "disputed",
            "debunked",
            "false claim",
            "misinformation",
            "conspiracy theory",
            "fringe belief",
            "pseudoscience",
            "unproven",
            "misleading"
        ]
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        text = re.sub(r'\s+', ' ', text).strip()
        text = text.replace('"', '').replace('"', '')
        return text
    
    async def _search_fact_checkers(self, claim: str) -> List[str]:
        """Search fact-checking sites for consensus view."""
        results = []
        search_query = quote_plus(f"fact check {claim}")
        
        for domain in self.fact_check_domains:
            try:
                async with self.session.get(
                    f"https://www.google.com/search?q=site:{domain}+{search_query}",
                    headers={"User-Agent": "Mozilla/5.0"}
                ) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')
                        
                        # Extract relevant snippets
                        for div in soup.find_all("div", class_="g"):
                            snippet = div.find("div", class_="IsZvec")
                            if snippet:
                                text = self._clean_text(snippet.get_text())
                                if any(ind.lower() in text.lower() 
                                      for ind in self.consensus_indicators + self.divergence_indicators):
                                    results.append(text)
            except Exception as e:
                logger.warning(f"Error searching {domain}: {e}")
                continue
        
        return results[:3]  # Return top 3 most relevant results
    
    async def _search_institutional_sources(self, claim: str) -> List[str]:
        """Search institutional sources for consensus view."""
        results = []
        search_query = quote_plus(claim)
        
        domain_query = " OR ".join(f"site:{domain}" for domain in self.institutional_domains)
        
        try:
            async with self.session.get(
                f"https://www.google.com/search?q=({domain_query})+{search_query}",
                headers={"User-Agent": "Mozilla/5.0"}
            ) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'lxml')
                    
                    # Extract relevant snippets
                    for div in soup.find_all("div", class_="g"):
                        snippet = div.find("div", class_="IsZvec")
                        if snippet:
                            text = self._clean_text(snippet.get_text())
                            if any(ind.lower() in text.lower() 
                                  for ind in self.consensus_indicators):
                                results.append(text)
        except Exception as e:
            logger.warning(f"Error searching institutional sources: {e}")
        
        return results[:3]  # Return top 3 most relevant results
    
    def _calculate_divergence(self, claim: str, consensus_sources: List[str]) -> tuple[float, str]:
        """Calculate how much a claim diverges from consensus sources."""
        divergence = 0.5  # Start neutral
        explanation = []
        
        # Look for strong indicators of divergence
        for source in consensus_sources:
            source_lower = source.lower()
            
            # Check divergence indicators
            for indicator in self.divergence_indicators:
                if indicator in source_lower:
                    divergence += 0.1
                    explanation.append(f"Source indicates '{indicator}'")
            
            # Check consensus indicators (reduce divergence)
            for indicator in self.consensus_indicators:
                if indicator in source_lower:
                    divergence -= 0.1
                    explanation.append(f"Source shows '{indicator}'")
            
            # Look for direct contradictions
            claim_words = set(claim.lower().split())
            negations = {"not", "no", "never", "false", "incorrect", "wrong"}
            if any(word in source_lower for word in claim_words) and \
               any(neg in source_lower for neg in negations):
                divergence += 0.2
                explanation.append("Source directly contradicts claim")
        
        # Normalize and create explanation
        divergence = max(0.0, min(1.0, divergence))
        explanation_text = " | ".join(explanation[:3])  # Top 3 reasons
        
        return divergence, explanation_text
    
    def _extract_consensus_view(self, sources: List[str]) -> str:
        """Extract the most representative consensus view from sources."""
        if not sources:
            return "No clear consensus view found"
            
        # Look for sources with consensus indicators first
        consensus_sources = []
        for source in sources:
            source_lower = source.lower()
            if any(ind in source_lower for ind in self.consensus_indicators):
                consensus_sources.append(source)
        
        if consensus_sources:
            # Use the most detailed consensus source
            return max(consensus_sources, key=len)
        
        # Fallback to the most detailed source
        return max(sources, key=len)
    
    async def check_position(self, position: Position) -> ConsensusCheck:
        """Check a position against conventional wisdom sources."""
        if not self.session:
            raise RuntimeError("Checker not initialized. Use async with.")
        
        logger.info(f"Checking position: {position.claim[:100]}...")
        
        # Gather evidence from multiple sources
        fact_check_results = await self._search_fact_checkers(position.claim)
        institutional_results = await self._search_institutional_sources(position.claim)
        
        # Combine all sources
        all_sources = fact_check_results + institutional_results
        
        # Calculate divergence and get explanation
        divergence, explanation = self._calculate_divergence(position.claim, all_sources)
        
        # Extract consensus view
        consensus_view = self._extract_consensus_view(all_sources)
        
        return ConsensusCheck(
            position=position,
            consensus_view=consensus_view,
            divergence_score=divergence,
            sources=all_sources,
            explanation=explanation
        )

async def test_checker():
    """Test the consensus checker with example positions."""
    from position_extractor import Position
    
    test_positions = [
        Position(
            claim="Social media is directly responsible for rising depression rates among teenagers",
            evidence="Multiple studies have shown correlations between social media use and depression",
            confidence=0.8,
            domains=["technology", "psychology"],
            context="Discussion of social media impacts",
            source_text=None
        ),
        Position(
            claim="Traditional religious institutions are becoming obsolete in modern society",
            evidence="Declining church attendance and religious affiliation statistics",
            confidence=0.7,
            domains=["theology", "culture"],
            context="Analysis of religious trends",
            source_text=None
        )
    ]
    
    async with ConsensusChecker() as checker:
        print("\n=== Consensus Checker Tests ===")
        for i, position in enumerate(test_positions, 1):
            print(f"\nTest {i}:")
            print("-" * 40)
            result = await checker.check_position(position)
            
            print(f"Position: {result.position.claim}")
            print(f"Consensus View: {result.consensus_view}")
            print(f"Divergence Score: {result.divergence_score:.2f}")
            print(f"Explanation: {result.explanation}")
            print("\nSources:")
            for source in result.sources:
                print(f"- {source[:100]}...")

if __name__ == "__main__":
    asyncio.run(test_checker()) 