"""
SpikyPOV Extractor
Combines position extraction and consensus checking to identify SpikyPOVs.
"""
from dataclasses import dataclass
from typing import List, Optional
import asyncio
import logging
from datetime import datetime
import json
from pathlib import Path
from position_extractor import PositionExtractor, Position
from consensus_checker import ConsensusChecker, ConsensusCheck

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SpikyPOV:
    """A complete SpikyPOV with both position and consensus information."""
    claim: str
    consensus_view: str
    evidence: str
    confidence: float
    divergence: float
    domains: List[str]
    explanation: str
    sources: List[str]
    
    def __str__(self):
        return (
            f"SpikyPOV:\n"
            f"Claim: {self.claim}\n"
            f"Consensus: {self.consensus_view}\n"
            f"Confidence: {self.confidence:.2f}\n"
            f"Divergence: {self.divergence:.2f}\n"
            f"Domains: {', '.join(self.domains)}\n"
            f"Explanation: {self.explanation}"
        )

class SpikyPOVExtractor:
    """Extracts SpikyPOVs from text by combining position extraction and consensus checking."""
    
    def __init__(self, min_confidence: float = 0.6, min_divergence: float = 0.6):
        self.position_extractor = PositionExtractor()
        self.min_confidence = min_confidence
        self.min_divergence = min_divergence
    
    async def extract_spikypovs(self, text: str) -> List[SpikyPOV]:
        """Extract SpikyPOVs from text."""
        # First extract positions
        positions = self.position_extractor.extract_positions(text)
        logger.info(f"Extracted {len(positions)} initial positions")
        
        # Filter by confidence
        confident_positions = [
            p for p in positions 
            if p.confidence >= self.min_confidence
        ]
        logger.info(f"Found {len(confident_positions)} confident positions")
        
        # Check against consensus
        spiky_povs = []
        async with ConsensusChecker() as checker:
            for position in confident_positions:
                check = await checker.check_position(position)
                
                # Only keep highly divergent positions
                if check.divergence_score >= self.min_divergence:
                    spiky_pov = SpikyPOV(
                        claim=position.claim,
                        consensus_view=check.consensus_view,
                        evidence=position.evidence,
                        confidence=position.confidence,
                        divergence=check.divergence_score,
                        domains=position.domains,
                        explanation=check.explanation or "No explanation provided",
                        sources=check.sources
                    )
                    spiky_povs.append(spiky_pov)
        
        logger.info(f"Found {len(spiky_povs)} SpikyPOVs")
        return spiky_povs
    
    def save_spikypovs(self, spiky_povs: List[SpikyPOV], 
                       output_dir: Path,
                       source_url: Optional[str] = None):
        """Save extracted SpikyPOVs to JSON."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Prepare output
        result = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source_url": source_url,
                "total_povs": len(spiky_povs)
            },
            "spiky_povs": [
                {
                    "claim": pov.claim,
                    "consensus_view": pov.consensus_view,
                    "evidence": pov.evidence,
                    "confidence": pov.confidence,
                    "divergence": pov.divergence,
                    "domains": pov.domains,
                    "explanation": pov.explanation,
                    "sources": pov.sources
                }
                for pov in spiky_povs
            ]
        }
        
        # Save to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"spikypovs_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"Saved results to {output_file}")
        return output_file

async def test_extractor():
    """Test the SpikyPOV extractor with example text."""
    test_text = """
    Modern society's obsession with technological progress is fundamentally altering human consciousness.
    Research clearly shows that excessive screen time is rewiring our brains, particularly in children.
    While experts claim this is merely an adaptation to new tools, the evidence suggests a deeper transformation.
    
    Traditional religious institutions have failed to address this crisis.
    Churches increasingly embrace secular values and digital culture, abandoning their spiritual foundations.
    Statistical data reveals that 70% of young people find no meaning in conventional religious practice.
    
    The intersection of technology and spirituality represents an unprecedented challenge.
    Digital devices have become our new gods, commanding more attention and devotion than any traditional deity.
    This transformation has profound implications for human development and societal cohesion.
    """
    
    extractor = SpikyPOVExtractor(min_confidence=0.6, min_divergence=0.6)
    
    print("\n=== SpikyPOV Extractor Test ===")
    print("Processing test text...")
    
    spiky_povs = await extractor.extract_spikypovs(test_text)
    
    print(f"\nFound {len(spiky_povs)} SpikyPOVs:")
    for i, pov in enumerate(spiky_povs, 1):
        print(f"\n{i}. {str(pov)}")
    
    # Save results
    output_dir = Path("../../04-SPIKYPOVS/test_results")
    extractor.save_spikypovs(spiky_povs, output_dir)

if __name__ == "__main__":
    asyncio.run(test_extractor()) 