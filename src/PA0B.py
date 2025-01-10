"""
Position Extractor for SpikyPOV Analysis
Extracts unique positions and claims from text, with confidence scoring.
"""
from dataclasses import dataclass
from typing import List, Set, Dict
import re
import spacy
from collections import defaultdict

@dataclass
class Position:
    """A unique position or claim extracted from the text."""
    claim: str
    evidence: str
    confidence: float  # 0-1 score based on emphasis/repetition
    domains: List[str]
    context: str
    
    def __hash__(self):
        return hash(self.claim)

class PositionExtractor:
    """Extracts and scores unique positions from text."""
    
    def __init__(self):
        # Load spaCy model for NLP tasks
        self.nlp = spacy.load("en_core_web_sm")
        
        # Emphasis markers increase confidence
        self.emphasis_markers = {
            "certainly": 0.1,
            "clearly": 0.1,
            "obviously": 0.1,
            "undoubtedly": 0.1,
            "indeed": 0.05,
            "absolutely": 0.1,
            "definitely": 0.1,
            "must": 0.05,
            "always": 0.05,
            "never": 0.05,
            "fundamental": 0.1,
            "essential": 0.1,
            "critical": 0.1,
            "crucial": 0.1,
            "vital": 0.1,
            "key": 0.05,
            "true": 0.05,
            "fact": 0.1,
            "reality": 0.1,
            "evidence": 0.1,
            "data": 0.1,
            "research": 0.1,
            "studies": 0.1,
            "statistics": 0.1,
            "proof": 0.1
        }
        
        # Statistical markers increase confidence
        self.stats_pattern = r"(\d+(?:\.\d+)?%|nearly \d+%|almost \d+%|over \d+%|about \d+%)"
        
        # Domain markers for categorization
        self.domain_markers = {
            "theology": ["scripture", "christian", "church", "god", "biblical", "religion", "faith", "spiritual", "divine", "holy", "sacred"],
            "philosophy": ["meaning", "truth", "reality", "civilization", "authentic", "fundamental", "essence", "nature", "being", "existence", "wisdom"],
            "culture": ["society", "modern", "cultural", "social", "community", "civilization", "tradition", "values", "norms", "customs", "zeitgeist"],
            "politics": ["political", "conservative", "liberal", "policy", "economics", "bureaucratic", "government", "power", "authority", "state", "regime"],
            "gender": ["men", "women", "masculine", "feminine", "marriage", "dating", "romance", "sexual", "male", "female", "relationship", "family"],
            "technology": ["digital", "virtual", "online", "internet", "tech", "computer", "ai", "artificial", "machine", "algorithm", "data"],
            "psychology": ["mind", "behavior", "cognitive", "mental", "psychological", "emotion", "desire", "motivation", "instinct", "drive"]
        }
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        text = re.sub(r'\s+', ' ', text).strip()
        text = text.replace('"', '').replace('"', '')
        text = re.sub(r'^[,.;]\s*', '', text)
        return text
    
    def _calculate_base_confidence(self, text: str) -> float:
        """Calculate base confidence score from emphasis markers."""
        text_lower = text.lower()
        confidence = 0.5  # Start at neutral
        
        # Check for emphasis markers
        for marker, boost in self.emphasis_markers.items():
            if marker in text_lower:
                confidence += boost
        
        # Check for statistics
        if re.search(self.stats_pattern, text):
            confidence += 0.2
        
        # Cap at 1.0
        return min(confidence, 1.0)
    
    def _infer_domains(self, text: str) -> List[str]:
        """Infer relevant domains for the position."""
        text_lower = text.lower()
        domains = set()
        
        for domain, markers in self.domain_markers.items():
            if any(marker in text_lower for marker in markers):
                domains.add(domain)
        
        return list(domains) if domains else ["philosophy"]
    
    def _is_claim_sentence(self, sent) -> bool:
        """Determine if a sentence contains a claim."""
        # Must be declarative
        if sent.text.strip().endswith("?"):
            return False
            
        # Look for claim indicators
        claim_indicators = {
            "ROOT": {"VBZ", "VBP"},  # Present tense verbs
            "nsubj": {"NN", "NNS", "PRP"},  # Noun subjects
            "aux": {"MD"}  # Modal auxiliaries
        }
        
        matches = defaultdict(set)
        for token in sent:
            if token.dep_ in claim_indicators:
                matches[token.dep_].add(token.tag_)
        
        # Check if we have enough matching elements
        return any(matches[dep] & tags for dep, tags in claim_indicators.items())
    
    def _get_context(self, doc, sent_idx: int, window: int = 2) -> str:
        """Get surrounding context for a sentence."""
        start = max(0, sent_idx - window)
        end = min(len(list(doc.sents)), sent_idx + window + 1)
        return " ".join(sent.text for sent in list(doc.sents)[start:end])
    
    def extract_positions(self, text: str) -> List[Position]:
        """Extract unique positions from text with confidence scoring."""
        positions = []
        seen_claims = set()
        
        # Process text with spaCy
        doc = self.nlp(text)
        
        # Analyze each sentence
        for i, sent in enumerate(doc.sents):
            if not self._is_claim_sentence(sent):
                continue
            
            # Clean and normalize the claim
            claim = self._clean_text(sent.text)
            if len(claim.split()) < 8:  # Skip very short claims
                continue
            
            # Skip if we've seen this or very similar claim
            if claim in seen_claims:
                continue
            
            # Calculate confidence
            confidence = self._calculate_base_confidence(claim)
            
            # Get context
            context = self._get_context(doc, i)
            
            # Create position
            position = Position(
                claim=claim,
                evidence=context,
                confidence=confidence,
                domains=self._infer_domains(context),
                context=context
            )
            
            positions.append(position)
            seen_claims.add(claim)
        
        # Sort by confidence
        positions.sort(key=lambda p: p.confidence, reverse=True)
        
        return positions

def main():
    """Example usage."""
    # Test text
    text = """
    Today, preachers frequently ignore the Scriptures, and claim that "women were made in the image of God". 
    This is a small, but meaningful omission of Genesis 2, the story of Adam and Eve. 
    According to the Scriptures, which superficial, feminist Christians pretend to believe, 
    men were created in the image of God… and women were created in the image of man.
    
    Statistical evidence clearly shows that 95% of women reject their options at first glance.
    The data is absolutely clear on this point. Research consistently demonstrates this pattern.
    """
    
    extractor = PositionExtractor()
    positions = extractor.extract_positions(text)
    
    print("\nExtracted Positions:")
    for i, pos in enumerate(positions, 1):
        print(f"\n{i}. Position:")
        print(f"   Claim: {pos.claim}")
        print(f"   Confidence: {pos.confidence:.2f}")
        print(f"   Domains: {', '.join(pos.domains)}")
        print(f"   Evidence: {pos.evidence[:100]}...")

if __name__ == "__main__":
    main() 