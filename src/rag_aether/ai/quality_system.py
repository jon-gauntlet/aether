"""Quality system for evaluating and improving RAG responses."""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

@dataclass
class QualityMetrics:
    """Quality metrics for RAG response."""
    relevance_score: float
    coherence_score: float
    factuality_score: float
    context_adherence: float
    overall_score: float
    metadata: Dict[str, Any]

@dataclass
class QualityFeedback:
    """Feedback for improving RAG response."""
    suggestions: List[str]
    improvements: Dict[str, Any]
    priority: float

class QualitySystem:
    """System for evaluating and improving RAG responses."""
    
    def __init__(
        self,
        relevance_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        coherence_model: str = "microsoft/deberta-v3-base",
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
        quality_threshold: float = 0.7
    ):
        """Initialize quality system.
        
        Args:
            relevance_model: Model for relevance scoring
            coherence_model: Model for coherence scoring
            device: Device to run models on
            quality_threshold: Minimum acceptable quality score
        """
        self.device = device
        self.quality_threshold = quality_threshold
        
        # Load models
        self.relevance_model = AutoModelForSequenceClassification.from_pretrained(relevance_model)
        self.relevance_tokenizer = AutoTokenizer.from_pretrained(relevance_model)
        self.relevance_model.to(device)
        
        self.coherence_model = AutoModelForSequenceClassification.from_pretrained(coherence_model)
        self.coherence_tokenizer = AutoTokenizer.from_pretrained(coherence_model)
        self.coherence_model.to(device)
        
        # Quality aspects and weights
        self.quality_weights = {
            "relevance": 0.35,
            "coherence": 0.25,
            "factuality": 0.25,
            "context_adherence": 0.15
        }
        
    def evaluate_response(
        self,
        query: str,
        response: str,
        context: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> QualityMetrics:
        """Evaluate quality of RAG response."""
        # Calculate individual scores
        relevance_score = self._evaluate_relevance(query, response)
        coherence_score = self._evaluate_coherence(response)
        factuality_score = self._evaluate_factuality(response, context)
        context_adherence = self._evaluate_context_adherence(response, context)
        
        # Calculate overall score
        overall_score = sum(
            score * self.quality_weights[aspect]
            for aspect, score in [
                ("relevance", relevance_score),
                ("coherence", coherence_score),
                ("factuality", factuality_score),
                ("context_adherence", context_adherence)
            ]
        )
        
        return QualityMetrics(
            relevance_score=relevance_score,
            coherence_score=coherence_score,
            factuality_score=factuality_score,
            context_adherence=context_adherence,
            overall_score=overall_score,
            metadata={
                "query": query,
                "context_length": len(context) if context else 0,
                "response_length": len(response),
                **(metadata if metadata else {})
            }
        )
        
    def generate_feedback(
        self,
        metrics: QualityMetrics,
        response: str,
        context: Optional[str] = None
    ) -> QualityFeedback:
        """Generate feedback for improving response quality.
        
        Args:
            metrics: Quality metrics
            response: Generated response
            context: Retrieved context
            
        Returns:
            Quality feedback
        """
        suggestions = []
        improvements = {}
        
        # Check each aspect
        if metrics.relevance_score < self.quality_threshold:
            suggestions.append("Improve relevance to query")
            improvements["relevance"] = self._suggest_relevance_improvements(
                metrics.metadata["query"],
                response
            )
            
        if metrics.coherence_score < self.quality_threshold:
            suggestions.append("Enhance response coherence")
            improvements["coherence"] = self._suggest_coherence_improvements(response)
            
        if metrics.factuality_score < self.quality_threshold:
            suggestions.append("Verify factual accuracy")
            improvements["factuality"] = self._suggest_factuality_improvements(
                response,
                context
            )
            
        if metrics.context_adherence < self.quality_threshold:
            suggestions.append("Better utilize context")
            improvements["context"] = self._suggest_context_improvements(
                response,
                context
            )
            
        # Calculate priority based on improvement potential
        priority = (self.quality_threshold - metrics.overall_score) / self.quality_threshold
        priority = max(0.0, min(1.0, priority))
        
        return QualityFeedback(
            suggestions=suggestions,
            improvements=improvements,
            priority=priority
        )
        
    def _evaluate_relevance(self, query: str, response: str) -> float:
        """Evaluate response relevance to query."""
        inputs = self.relevance_tokenizer(
            query,
            response,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.relevance_model(**inputs)
            scores = torch.softmax(outputs.logits, dim=1)
            relevance_score = scores[0][1].item()  # Positive class score
            
        return relevance_score
        
    def _evaluate_coherence(self, response: str) -> float:
        """Evaluate response coherence."""
        inputs = self.coherence_tokenizer(
            response,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.coherence_model(**inputs)
            scores = torch.softmax(outputs.logits, dim=1)
            coherence_score = scores[0][1].item()  # Positive class score
            
        return coherence_score
        
    def _evaluate_factuality(self, response: str, context: Optional[str]) -> float:
        """Evaluate response factuality."""
        if not context:
            return 0.5  # Neutral score without context
            
        # Compare response statements with context
        # This is a simplified version - could be enhanced with NLI models
        response_facts = set(response.lower().split("."))
        context_facts = set(context.lower().split("."))
        
        overlap = len(response_facts.intersection(context_facts))
        total = len(response_facts)
        
        return overlap / total if total > 0 else 0.0
        
    def _evaluate_context_adherence(self, response: str, context: Optional[str]) -> float:
        """Evaluate how well response adheres to context."""
        if not context:
            return 0.5  # Neutral score without context
            
        # Calculate text similarity
        response_tokens = set(response.lower().split())
        context_tokens = set(context.lower().split())
        
        intersection = len(response_tokens.intersection(context_tokens))
        union = len(response_tokens.union(context_tokens))
        
        return intersection / union if union > 0 else 0.0
        
    def _suggest_relevance_improvements(self, query: str, response: str) -> Dict[str, Any]:
        """Suggest improvements for relevance."""
        return {
            "focus_areas": self._identify_irrelevant_parts(response, query),
            "query_aspects": self._extract_query_aspects(query),
            "suggested_additions": self._suggest_relevant_content(query)
        }
        
    def _suggest_coherence_improvements(self, response: str) -> Dict[str, Any]:
        """Suggest improvements for coherence."""
        return {
            "structure": self._analyze_structure(response),
            "transitions": self._identify_weak_transitions(response),
            "flow": self._analyze_logical_flow(response)
        }
        
    def _suggest_factuality_improvements(
        self,
        response: str,
        context: Optional[str]
    ) -> Dict[str, Any]:
        """Suggest improvements for factuality."""
        return {
            "unsupported_claims": self._identify_unsupported_claims(response, context),
            "missing_context": self._identify_missing_context(response, context),
            "verification_needed": self._identify_verification_needs(response)
        }
        
    def _suggest_context_improvements(
        self,
        response: str,
        context: Optional[str]
    ) -> Dict[str, Any]:
        """Suggest improvements for context utilization."""
        return {
            "unused_context": self._identify_unused_context(response, context),
            "integration_points": self._suggest_integration_points(response, context),
            "context_gaps": self._identify_context_gaps(response, context)
        }
        
    def _identify_irrelevant_parts(self, response: str, query: str) -> List[str]:
        """Identify parts of response not relevant to query."""
        # Simplified implementation - could be enhanced with more sophisticated NLP
        query_tokens = set(query.lower().split())
        sentences = response.split(".")
        
        irrelevant = []
        for sentence in sentences:
            sentence_tokens = set(sentence.lower().split())
            if not sentence_tokens.intersection(query_tokens):
                irrelevant.append(sentence.strip())
                
        return irrelevant
        
    def _extract_query_aspects(self, query: str) -> List[str]:
        """Extract key aspects of query to address."""
        # Simple implementation - could be enhanced with dependency parsing
        return [word for word in query.split() if len(word) > 3]
        
    def _suggest_relevant_content(self, query: str) -> List[str]:
        """Suggest relevant content to add."""
        # Placeholder - could be enhanced with knowledge base
        aspects = self._extract_query_aspects(query)
        return [f"Add information about {aspect}" for aspect in aspects]
        
    def _analyze_structure(self, response: str) -> Dict[str, Any]:
        """Analyze response structure."""
        sentences = response.split(".")
        return {
            "num_sentences": len(sentences),
            "avg_length": np.mean([len(s.split()) for s in sentences]),
            "structure_score": min(1.0, len(sentences) / 10)  # Simple heuristic
        }
        
    def _identify_weak_transitions(self, response: str) -> List[Tuple[str, str]]:
        """Identify weak transitions between sentences."""
        sentences = [s.strip() for s in response.split(".") if s.strip()]
        weak_transitions = []
        
        for i in range(len(sentences) - 1):
            if not self._has_strong_transition(sentences[i], sentences[i + 1]):
                weak_transitions.append((sentences[i], sentences[i + 1]))
                
        return weak_transitions
        
    def _has_strong_transition(self, sent1: str, sent2: str) -> bool:
        """Check if transition between sentences is strong."""
        # Simple implementation - could be enhanced with discourse analysis
        transition_words = {"however", "therefore", "consequently", "moreover", "additionally"}
        sent2_starts = set(sent2.lower().split()[:2])
        return bool(sent2_starts.intersection(transition_words))
        
    def _analyze_logical_flow(self, response: str) -> Dict[str, Any]:
        """Analyze logical flow of response."""
        sentences = response.split(".")
        return {
            "flow_breaks": self._find_flow_breaks(sentences),
            "topic_coherence": self._evaluate_topic_coherence(sentences),
            "suggestions": self._suggest_flow_improvements(sentences)
        }
        
    def _find_flow_breaks(self, sentences: List[str]) -> List[int]:
        """Find indices where logical flow breaks."""
        breaks = []
        for i in range(len(sentences) - 1):
            if not self._sentences_connected(sentences[i], sentences[i + 1]):
                breaks.append(i)
        return breaks
        
    def _sentences_connected(self, sent1: str, sent2: str) -> bool:
        """Check if sentences are logically connected."""
        # Simple implementation - could be enhanced with coreference resolution
        sent1_tokens = set(sent1.lower().split())
        sent2_tokens = set(sent2.lower().split())
        return bool(sent1_tokens.intersection(sent2_tokens))
        
    def _evaluate_topic_coherence(self, sentences: List[str]) -> float:
        """Evaluate topic coherence across sentences."""
        # Simple implementation - could be enhanced with topic modeling
        all_tokens = set()
        common_tokens = set(sentences[0].lower().split())
        
        for sent in sentences[1:]:
            tokens = set(sent.lower().split())
            all_tokens.update(tokens)
            common_tokens.intersection_update(tokens)
            
        return len(common_tokens) / len(all_tokens) if all_tokens else 0.0
        
    def _suggest_flow_improvements(self, sentences: List[str]) -> List[str]:
        """Suggest improvements for logical flow."""
        suggestions = []
        
        if len(sentences) < 3:
            suggestions.append("Add more detail to develop ideas")
            
        if not self._has_conclusion(sentences):
            suggestions.append("Add a concluding sentence")
            
        if not self._has_introduction(sentences):
            suggestions.append("Add an introductory sentence")
            
        return suggestions
        
    def _has_conclusion(self, sentences: List[str]) -> bool:
        """Check if response has a conclusion."""
        conclusion_markers = {"in conclusion", "therefore", "thus", "finally"}
        last_sent = sentences[-1].lower()
        return any(marker in last_sent for marker in conclusion_markers)
        
    def _has_introduction(self, sentences: List[str]) -> bool:
        """Check if response has an introduction."""
        intro_markers = {"first", "to begin", "initially"}
        first_sent = sentences[0].lower()
        return any(marker in first_sent for marker in intro_markers)
        
    def _identify_unsupported_claims(
        self,
        response: str,
        context: Optional[str]
    ) -> List[str]:
        """Identify claims not supported by context."""
        if not context:
            return []
            
        response_sentences = response.split(".")
        context_tokens = set(context.lower().split())
        
        unsupported = []
        for sentence in response_sentences:
            sentence_tokens = set(sentence.lower().split())
            if len(sentence_tokens) > 3 and not sentence_tokens.intersection(context_tokens):
                unsupported.append(sentence.strip())
                
        return unsupported
        
    def _identify_missing_context(
        self,
        response: str,
        context: Optional[str]
    ) -> List[str]:
        """Identify important context not used in response."""
        if not context:
            return []
            
        context_sentences = context.split(".")
        response_tokens = set(response.lower().split())
        
        missing = []
        for sentence in context_sentences:
            sentence_tokens = set(sentence.lower().split())
            if len(sentence_tokens) > 3 and not sentence_tokens.intersection(response_tokens):
                missing.append(sentence.strip())
                
        return missing
        
    def _identify_verification_needs(self, response: str) -> List[str]:
        """Identify statements needing verification."""
        # Look for specific claims or statistics
        sentences = response.split(".")
        needs_verification = []
        
        claim_markers = {"studies show", "research indicates", "according to", "statistics"}
        number_pattern = r'\d+(?:\.\d+)?%?'
        
        for sentence in sentences:
            lower_sent = sentence.lower()
            if (
                any(marker in lower_sent for marker in claim_markers) or
                bool(re.search(number_pattern, sentence))
            ):
                needs_verification.append(sentence.strip())
                
        return needs_verification 