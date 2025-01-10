"""
Position Extractor for SpikyPOV Analysis
Extracts unique positions and claims from text, with confidence scoring.
"""
from dataclasses import dataclass
from typing import List, Set, Dict, Optional
import re
import spacy
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Position:
    """A unique position or claim extracted from the text."""
    claim: str
    evidence: str
    confidence: float  # 0-1 score based on emphasis/repetition
    domains: List[str]
    context: str
    source_text: Optional[str] = None  # Original text containing the claim
    
    def __hash__(self):
        return hash(self.claim)
    
    def __str__(self):
        return f"Claim: {self.claim}\nConfidence: {self.confidence:.2f}\nDomains: {', '.join(self.domains)}"

class PositionExtractor:
    """Extracts and scores unique positions from text."""
    
    def __init__(self):
        # Load spaCy model for NLP tasks
        self.nlp = spacy.load("en_core_web_sm")
        
        # Emphasis markers increase confidence
        self.emphasis_markers = {
            # Strong emphasis (+0.15)
            "undoubtedly": 0.15,
            "unquestionably": 0.15,
            "indisputably": 0.15,
            "irrefutably": 0.15,
            "categorically": 0.15,
            
            # Clear emphasis (+0.1)
            "certainly": 0.1,
            "clearly": 0.1,
            "obviously": 0.1,
            "absolutely": 0.1,
            "definitely": 0.1,
            "fundamental": 0.1,
            "essential": 0.1,
            "critical": 0.1,
            "crucial": 0.1,
            "vital": 0.1,
            
            # Moderate emphasis (+0.05)
            "indeed": 0.05,
            "must": 0.05,
            "always": 0.05,
            "never": 0.05,
            "key": 0.05,
            "true": 0.05,
            
            # Evidence-based emphasis (+0.1)
            "fact": 0.1,
            "reality": 0.1,
            "evidence": 0.1,
            "data": 0.1,
            "research": 0.1,
            "studies": 0.1,
            "statistics": 0.1,
            "proof": 0.1,
            
            # Strong negation (+0.1)
            "false": 0.1,
            "wrong": 0.1,
            "incorrect": 0.1,
            "mistaken": 0.1,
            "error": 0.1,
            
            # Moral emphasis (+0.1)
            "should": 0.1,
            "ought": 0.1,
            "must": 0.1,
            "right": 0.1,
            "wrong": 0.1,
            "good": 0.1,
            "evil": 0.1,
            "moral": 0.1,
            "immoral": 0.1
        }
        
        # Statistical markers increase confidence
        self.stats_pattern = r"(\d+(?:\.\d+)?%|nearly \d+%|almost \d+%|over \d+%|about \d+%|\d+ percent)"
        
        # Domain markers for categorization
        self.domain_markers = {
            "theology": ["scripture", "christian", "church", "god", "biblical", "religion", "faith", "spiritual", "divine", "holy", "sacred", "soul", "spirit", "prayer", "worship", "sin", "salvation", "eternal", "heaven", "hell"],
            "philosophy": ["meaning", "truth", "reality", "civilization", "authentic", "fundamental", "essence", "nature", "being", "existence", "wisdom", "knowledge", "reason", "logic", "ethics", "morality", "virtue", "good", "evil", "justice"],
            "culture": ["society", "modern", "cultural", "social", "community", "civilization", "tradition", "values", "norms", "customs", "zeitgeist", "art", "media", "entertainment", "fashion", "trend", "popular", "mainstream", "alternative", "subculture"],
            "politics": ["political", "conservative", "liberal", "policy", "economics", "bureaucratic", "government", "power", "authority", "state", "regime", "democracy", "freedom", "rights", "law", "regulation", "policy", "election", "vote", "party"],
            "gender": ["men", "women", "masculine", "feminine", "marriage", "dating", "romance", "sexual", "male", "female", "relationship", "family", "husband", "wife", "mother", "father", "son", "daughter", "gender", "sex"],
            "technology": ["digital", "virtual", "online", "internet", "tech", "computer", "ai", "artificial", "machine", "algorithm", "data", "software", "hardware", "network", "cyber", "electronic", "device", "program", "code", "system"],
            "psychology": ["mind", "behavior", "cognitive", "mental", "psychological", "emotion", "desire", "motivation", "instinct", "drive", "conscious", "unconscious", "personality", "trait", "character", "mood", "feeling", "thought", "belief", "attitude"]
        }
        
        # Claim indicators that boost confidence
        self.claim_indicators = {
            "assert": 0.1,
            "claim": 0.1,
            "argue": 0.1,
            "contend": 0.1,
            "maintain": 0.1,
            "believe": 0.05,
            "think": 0.05,
            "suggest": 0.05,
            "propose": 0.05,
            "hypothesize": 0.05
        }
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        text = re.sub(r'\s+', ' ', text).strip()
        text = text.replace('"', '').replace('"', '')
        text = re.sub(r'^[,.;]\s*', '', text)
        if text and not text[0].isupper():
            text = text[0].upper() + text[1:]
        return text
    
    def _calculate_base_confidence(self, text: str) -> float:
        """Calculate base confidence score from emphasis markers."""
        text_lower = text.lower()
        confidence = 0.5  # Start at neutral
        
        # Check for emphasis markers
        for marker, boost in self.emphasis_markers.items():
            if marker in text_lower:
                confidence += boost
        
        # Check for claim indicators
        for indicator, boost in self.claim_indicators.items():
            if indicator in text_lower:
                confidence += boost
        
        # Check for statistics
        if re.search(self.stats_pattern, text):
            confidence += 0.2
        
        # Check for repeated emphasis
        emphasis_count = sum(1 for marker in self.emphasis_markers if text_lower.count(marker) > 1)
        confidence += emphasis_count * 0.05
        
        # Cap at 1.0
        return min(confidence, 1.0)
    
    def _infer_domains(self, text: str) -> List[str]:
        """Infer relevant domains for the position."""
        text_lower = text.lower()
        domains = set()
        
        # Count domain markers
        domain_counts = defaultdict(int)
        for domain, markers in self.domain_markers.items():
            for marker in markers:
                if marker in text_lower:
                    domain_counts[domain] += 1
        
        # Add domains with significant presence
        for domain, count in domain_counts.items():
            if count >= 2:  # Require at least two markers
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
        
        # Count matching elements
        matches = defaultdict(set)
        for token in sent:
            if token.dep_ in claim_indicators:
                matches[token.dep_].add(token.tag_)
        
        # Check for negation
        has_negation = any(token.dep_ == "neg" for token in sent)
        
        # Calculate claim strength
        claim_strength = sum(
            len(matches[dep] & tags) 
            for dep, tags in claim_indicators.items()
        )
        
        # Boost strength for negation
        if has_negation:
            claim_strength += 1
        
        return claim_strength >= 1
    
    def _get_context(self, doc, sent_idx: int, window: int = 2) -> str:
        """Get surrounding context for a sentence."""
        sents = list(doc.sents)
        start = max(0, sent_idx - window)
        end = min(len(sents), sent_idx + window + 1)
        return " ".join(sent.text for sent in sents[start:end])
    
    def _merge_similar_positions(self, positions: List[Position], threshold: float = 0.7) -> List[Position]:
        """Merge positions that are very similar."""
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Get embeddings for all claims
        claims = [p.claim for p in positions]
        embeddings = model.encode(claims)
        
        # Find similar pairs
        merged = set()
        merged_positions = []
        
        for i, pos1 in enumerate(positions):
            if i in merged:
                continue
                
            similar_indices = []
            for j, pos2 in enumerate(positions[i+1:], i+1):
                if j in merged:
                    continue
                    
                # Calculate cosine similarity
                similarity = embeddings[i] @ embeddings[j] / (
                    (embeddings[i] @ embeddings[i]) ** 0.5 * 
                    (embeddings[j] @ embeddings[j]) ** 0.5
                )
                
                if similarity > threshold:
                    similar_indices.append(j)
            
            if similar_indices:
                # Merge similar positions
                similar_positions = [pos1] + [positions[j] for j in similar_indices]
                merged_pos = self._merge_positions(similar_positions)
                merged_positions.append(merged_pos)
                merged.add(i)
                merged.update(similar_indices)
            else:
                merged_positions.append(pos1)
        
        return merged_positions
    
    def _merge_positions(self, positions: List[Position]) -> Position:
        """Merge a list of similar positions into one."""
        # Use the highest confidence claim
        best_pos = max(positions, key=lambda p: p.confidence)
        
        # Combine domains
        all_domains = set()
        for pos in positions:
            all_domains.update(pos.domains)
        
        # Combine evidence
        all_evidence = "\n\n".join(p.evidence for p in positions)
        
        return Position(
            claim=best_pos.claim,
            evidence=all_evidence,
            confidence=min(1.0, max(p.confidence for p in positions) + 0.1),
            domains=list(all_domains),
            context=best_pos.context,
            source_text=best_pos.source_text
        )
    
    def extract_positions(self, text: str) -> List[Position]:
        """Extract unique positions from text with confidence scoring."""
        positions = []
        seen_claims = set()
        
        # Process text with spaCy
        doc = self.nlp(text)
        logger.info(f"Processing text of length {len(text)} characters")
        
        # Analyze each sentence
        for i, sent in enumerate(doc.sents):
            if not self._is_claim_sentence(sent):
                continue
            
            # Clean and normalize the claim
            claim = self._clean_text(sent.text)
            if len(claim.split()) < 8:  # Skip very short claims
                continue
            
            # Skip if we've seen this exact claim
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
                context=context,
                source_text=text
            )
            
            positions.append(position)
            seen_claims.add(claim)
        
        logger.info(f"Found {len(positions)} initial positions")
        
        # Merge similar positions
        positions = self._merge_similar_positions(positions)
        logger.info(f"Merged into {len(positions)} unique positions")
        
        # Sort by confidence
        positions.sort(key=lambda p: p.confidence, reverse=True)
        
        return positions

def test_extractor():
    """Test the position extractor with various examples."""
    test_texts = [
        # Test 1: Basic claims with emphasis
        """
        It is absolutely clear that modern society has lost its way. 
        Research consistently shows that traditional values are declining.
        Statistics reveal that 75% of people are unhappy with their lives.
        """,
        
        # Test 2: Multiple domains
        """
        The intersection of technology and spirituality is fundamentally changing human consciousness.
        Digital devices are becoming our new gods, while traditional religious practice declines.
        This transformation has profound implications for both individual psychology and societal cohesion.
        """,
        
        # Test 3: Complex claims with evidence
        """
        The data unquestionably shows that social media use correlates with increased depression.
        Multiple studies have confirmed this link, with research indicating a 30% rise in mental health issues.
        However, some researchers argue that the relationship is more complex than initially thought.
        These findings suggest that the way we use technology, rather than technology itself, is the key factor.
        """,
        
        # Test 4: Theological and philosophical claims
        """
        Modern Christianity has deviated significantly from its scriptural foundations.
        The evidence for this can be found in how churches increasingly embrace secular values.
        Biblical teachings clearly state certain moral principles, yet many churches today ignore these truths.
        This represents a fundamental shift in religious authority and divine interpretation.
        """
    ]
    
    extractor = PositionExtractor()
    
    print("\n=== Position Extractor Tests ===")
    for i, text in enumerate(test_texts, 1):
        print(f"\nTest {i}:")
        print("-" * 40)
        positions = extractor.extract_positions(text)
        
        for j, pos in enumerate(positions, 1):
            print(f"\nPosition {j}:")
            print(str(pos))

if __name__ == "__main__":
    test_extractor() 