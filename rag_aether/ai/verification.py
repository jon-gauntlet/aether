"""Response verification and fact-checking system."""

from typing import Dict, List, Optional, Tuple
import logging
from pathlib import Path
import json
import time
from dataclasses import dataclass, asdict
from sentence_transformers import SentenceTransformer

from ..errors import SearchError

logger = logging.getLogger(__name__)

@dataclass
class VerificationResult:
    """Result of a verification check."""
    is_verified: bool
    confidence: float
    supporting_facts: List[Dict]
    contradicting_facts: List[Dict]
    explanation: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'VerificationResult':
        """Create from dictionary."""
        return cls(**data)

class VerificationSystem:
    """System for verifying responses against source documents."""
    
    def __init__(self,
                 model_name: str = "all-MiniLM-L6-v2",
                 min_confidence: float = 0.7,
                 cache_dir: Optional[str] = None):
        """Initialize the verification system.
        
        Args:
            model_name: Name of the sentence transformer model
            min_confidence: Minimum confidence threshold for verification
            cache_dir: Optional directory for caching results
        """
        self.model = SentenceTransformer(model_name)
        self.min_confidence = min_confidence
        self.cache_dir = Path(cache_dir) if cache_dir else None
        
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            
    def _get_cache_path(self, response: str) -> Optional[Path]:
        """Get cache file path for a response."""
        if not self.cache_dir:
            return None
            
        # Use hash of response as filename
        filename = f"{hash(response)}.json"
        return self.cache_dir / filename
        
    def _load_from_cache(self, response: str) -> Optional[VerificationResult]:
        """Load verification result from cache."""
        cache_path = self._get_cache_path(response)
        if not cache_path or not cache_path.exists():
            return None
            
        try:
            with open(cache_path, 'r') as f:
                data = json.load(f)
            return VerificationResult.from_dict(data)
            
        except Exception as e:
            logger.warning(f"Failed to load from cache: {e}")
            return None
            
    def _save_to_cache(self, response: str, result: VerificationResult) -> None:
        """Save verification result to cache."""
        cache_path = self._get_cache_path(response)
        if not cache_path:
            return
            
        try:
            with open(cache_path, 'w') as f:
                json.dump(result.to_dict(), f)
                
        except Exception as e:
            logger.warning(f"Failed to save to cache: {e}")
            
    def _extract_claims(self, response: str) -> List[str]:
        """Extract verifiable claims from response."""
        # TODO: Implement more sophisticated claim extraction
        # For now, treat each sentence as a claim
        claims = [s.strip() for s in response.split('.') if s.strip()]
        return claims
        
    def _find_supporting_facts(self,
                             claim: str,
                             documents: List[Dict],
                             threshold: float = 0.7) -> List[Dict]:
        """Find facts that support a claim."""
        claim_embedding = self.model.encode([claim])[0]
        
        supporting_facts = []
        for doc in documents:
            # Encode document text
            doc_embedding = self.model.encode([doc['text']])[0]
            
            # Compute similarity
            similarity = float(claim_embedding @ doc_embedding)
            
            if similarity >= threshold:
                fact = doc.copy()
                fact['similarity'] = similarity
                supporting_facts.append(fact)
                
        return sorted(supporting_facts,
                     key=lambda x: x['similarity'],
                     reverse=True)
                     
    def _find_contradictions(self,
                           claim: str,
                           documents: List[Dict],
                           threshold: float = 0.7) -> List[Dict]:
        """Find facts that contradict a claim."""
        # TODO: Implement contradiction detection
        # For now, return empty list
        return []
        
    def verify_response(self,
                       response: str,
                       source_documents: List[Dict],
                       use_cache: bool = True) -> VerificationResult:
        """Verify a response against source documents.
        
        Args:
            response: Response to verify
            source_documents: List of source documents
            use_cache: Whether to use cached results
            
        Returns:
            VerificationResult with verification details
        """
        # Check cache first
        if use_cache:
            cached = self._load_from_cache(response)
            if cached:
                return cached
                
        try:
            # Extract claims
            claims = self._extract_claims(response)
            
            # Track supporting and contradicting facts
            all_supporting = []
            all_contradicting = []
            
            # Verify each claim
            for claim in claims:
                supporting = self._find_supporting_facts(
                    claim,
                    source_documents
                )
                contradicting = self._find_contradictions(
                    claim,
                    source_documents
                )
                
                all_supporting.extend(supporting)
                all_contradicting.extend(contradicting)
                
            # Compute overall confidence
            if not claims:
                confidence = 0.0
            else:
                # Average similarity of supporting facts
                confidence = sum(f['similarity'] for f in all_supporting)
                confidence /= len(claims)
                
            # Create result
            result = VerificationResult(
                is_verified=confidence >= self.min_confidence,
                confidence=confidence,
                supporting_facts=all_supporting,
                contradicting_facts=all_contradicting,
                explanation=self._generate_explanation(
                    confidence,
                    all_supporting,
                    all_contradicting
                )
            )
            
            # Cache result
            if use_cache:
                self._save_to_cache(response, result)
                
            return result
            
        except Exception as e:
            raise SearchError(f"Verification failed: {e}")
            
    def _generate_explanation(self,
                            confidence: float,
                            supporting: List[Dict],
                            contradicting: List[Dict]) -> str:
        """Generate explanation for verification result."""
        parts = []
        
        # Add confidence assessment
        if confidence >= self.min_confidence:
            parts.append(
                f"Response is verified with {confidence:.1%} confidence."
            )
        else:
            parts.append(
                f"Response could not be verified. Confidence: {confidence:.1%}"
            )
            
        # Add supporting evidence
        if supporting:
            parts.append(
                f"Found {len(supporting)} supporting facts."
            )
            
        # Add contradictions
        if contradicting:
            parts.append(
                f"Found {len(contradicting)} contradicting facts."
            )
            
        return " ".join(parts)
        
    def batch_verify(self,
                    responses: List[str],
                    source_documents: List[Dict],
                    use_cache: bool = True) -> List[VerificationResult]:
        """Verify multiple responses in batch.
        
        Args:
            responses: List of responses to verify
            source_documents: List of source documents
            use_cache: Whether to use cached results
            
        Returns:
            List of VerificationResults
        """
        results = []
        for response in responses:
            result = self.verify_response(
                response,
                source_documents,
                use_cache=use_cache
            )
            results.append(result)
        return results 