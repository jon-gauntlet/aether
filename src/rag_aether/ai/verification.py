"""Verification module for RAG system components."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import util

@dataclass
class VerificationResult:
    """Result of a verification check."""
    success: bool
    score: float
    details: Dict[str, Any]
    error: Optional[str] = None

def verify_embeddings(embeddings: np.ndarray) -> VerificationResult:
    """Verify quality of document embeddings.
    
    Checks:
    - Vector dimensions
    - Vector norms
    - Null vectors
    """
    try:
        if len(embeddings.shape) != 2:
            return VerificationResult(
                success=False,
                score=0.0,
                details={},
                error="Invalid embedding shape"
            )
            
        # Check vector norms
        norms = np.linalg.norm(embeddings, axis=1)
        null_vectors = np.sum(norms == 0)
        avg_norm = np.mean(norms)
        
        # Check for NaN/Inf
        if np.any(np.isnan(embeddings)) or np.any(np.isinf(embeddings)):
            return VerificationResult(
                success=False,
                score=0.0,
                details={
                    "has_nan": np.any(np.isnan(embeddings)),
                    "has_inf": np.any(np.isinf(embeddings))
                },
                error="Found NaN or Inf values"
            )
            
        details = {
            "num_vectors": len(embeddings),
            "dimension": embeddings.shape[1],
            "null_vectors": int(null_vectors),
            "avg_norm": float(avg_norm),
            "min_norm": float(np.min(norms)),
            "max_norm": float(np.max(norms))
        }
        
        # Score based on quality metrics
        score = 1.0
        if null_vectors > 0:
            score *= (1 - null_vectors / len(embeddings))
        if avg_norm < 0.1 or avg_norm > 10:
            score *= 0.5
            
        return VerificationResult(
            success=score > 0.8,
            score=score,
            details=details
        )
        
    except Exception as e:
        return VerificationResult(
            success=False,
            score=0.0,
            details={},
            error=str(e)
        )

def verify_retrieval(query_results: List[Dict[str, Any]], query: str, 
                    expected_results: Optional[List[str]] = None) -> VerificationResult:
    """Verify quality of retrieval results.
    
    Args:
        query_results: List of retrieved documents with scores
        query: Original query string
        expected_results: Optional list of expected document IDs
    """
    try:
        if not query_results:
            return VerificationResult(
                success=False,
                score=0.0,
                details={},
                error="No results returned"
            )
            
        # Check scores are normalized
        scores = [r["score"] for r in query_results]
        if not all(-1.0 <= s <= 1.0 for s in scores):
            return VerificationResult(
                success=False,
                score=0.0,
                details={"scores": scores},
                error="Scores not normalized"
            )
            
        details = {
            "num_results": len(query_results),
            "avg_score": float(np.mean(scores)),
            "min_score": float(np.min(scores)),
            "max_score": float(np.max(scores))
        }
        
        # Check against expected results if provided
        if expected_results:
            retrieved_ids = [r["document"].get("id") for r in query_results]
            correct = sum(1 for id in retrieved_ids if id in expected_results)
            precision = correct / len(query_results)
            recall = correct / len(expected_results)
            f1 = 2 * (precision * recall) / (precision + recall) if precision + recall > 0 else 0
            
            details.update({
                "precision": precision,
                "recall": recall,
                "f1_score": f1
            })
            score = f1
        else:
            # Score based on result quality
            score = float(np.mean(scores))
            
        return VerificationResult(
            success=score > 0.5,
            score=score,
            details=details
        )
        
    except Exception as e:
        return VerificationResult(
            success=False,
            score=0.0,
            details={},
            error=str(e)
        )

def verify_rag_pipeline(query: str, response: str, context_docs: List[Dict[str, Any]],
                       expected_answer: Optional[str] = None) -> VerificationResult:
    """Verify the complete RAG pipeline including response generation.
    
    Args:
        query: User query
        response: Generated response
        context_docs: Retrieved context documents
        expected_answer: Optional expected answer for comparison
    """
    try:
        details = {
            "response_length": len(response),
            "num_context_docs": len(context_docs)
        }
        
        # Verify response uses context by checking for key phrases
        context_used = False
        response_lower = response.lower()
        
        for doc in context_docs:
            content = doc["content"].lower()
            # Split content into significant phrases (3+ words)
            phrases = []
            for sentence in content.split("."):
                words = sentence.strip().split()
                if len(words) >= 3:
                    # Create overlapping phrases
                    for i in range(len(words) - 2):
                        phrase = " ".join(words[i:i+3])
                        if len(phrase) > 10:  # Only phrases with substantial length
                            phrases.append(phrase)
            
            # Check if any significant phrase appears in response
            for phrase in phrases:
                if phrase in response_lower:
                    context_used = True
                    details["matching_phrase"] = phrase
                    break
            if context_used:
                break
                
        if not context_used:
            return VerificationResult(
                success=False,
                score=0.3,
                details=details,
                error="Response does not use provided context"
            )
            
        # Compare with expected answer if provided
        if expected_answer:
            # Use sentence transformers for semantic similarity
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
            
            response_embedding = model.encode(response, convert_to_tensor=True)
            expected_embedding = model.encode(expected_answer, convert_to_tensor=True)
            
            similarity = util.pytorch_cos_sim(response_embedding, expected_embedding).item()
            
            details["answer_similarity"] = float(similarity)
            score = similarity
        else:
            # Score based on context usage and response quality
            score = 0.7 if context_used else 0.3
            
        return VerificationResult(
            success=score > 0.5,
            score=score,
            details=details
        )
        
    except Exception as e:
        return VerificationResult(
            success=False,
            score=0.0,
            details={},
            error=str(e)
        ) 