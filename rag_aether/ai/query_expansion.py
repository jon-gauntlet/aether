"""Query expansion and preprocessing system."""

from typing import Dict, List, Optional, Set, Tuple
import re
from dataclasses import dataclass
import numpy as np
from sentence_transformers import SentenceTransformer
import spacy
from spacy.tokens import Doc

from ..errors import QueryError

@dataclass
class ExpandedQuery:
    """Container for expanded query information."""
    
    original_query: str
    expanded_queries: List[str]
    weights: List[float]
    context: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'original_query': self.original_query,
            'expanded_queries': self.expanded_queries,
            'weights': [float(w) for w in self.weights],
            'context': self.context
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ExpandedQuery':
        """Create from dictionary."""
        return cls(**data)

class QueryPreprocessor:
    """Handles query preprocessing and normalization."""
    
    def __init__(self):
        """Initialize the preprocessor."""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Download if not available
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
            
    def preprocess(self, query: str) -> str:
        """Preprocess and normalize a query."""
        # Basic cleaning
        query = query.strip().lower()
        query = re.sub(r'\s+', ' ', query)
        
        # Process with spaCy
        doc = self.nlp(query)
        
        # Remove stopwords and punctuation
        tokens = [token.text for token in doc 
                 if not token.is_stop and not token.is_punct]
        
        # Lemmatize
        lemmas = [token.lemma_ for token in doc 
                 if not token.is_stop and not token.is_punct]
        
        # Combine original tokens and lemmas
        processed = ' '.join(set(tokens + lemmas))
        return processed
        
    def extract_entities(self, query: str) -> Dict[str, List[str]]:
        """Extract named entities from query."""
        doc = self.nlp(query)
        entities = {}
        
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            entities[ent.label_].append(ent.text)
            
        return entities
        
    def extract_keywords(self, query: str) -> List[str]:
        """Extract important keywords from query."""
        doc = self.nlp(query)
        
        # Get nouns and verbs
        keywords = [token.text for token in doc 
                   if (token.pos_ in ['NOUN', 'VERB'] and 
                       not token.is_stop)]
                       
        return keywords

class QueryExpander:
    """Expands queries using various techniques."""
    
    def __init__(self, 
                 model_name: str = "all-MiniLM-L6-v2",
                 min_similarity: float = 0.7):
        """Initialize the expander.
        
        Args:
            model_name: Name of the sentence transformer model
            min_similarity: Minimum similarity for semantic variations
        """
        self.model = SentenceTransformer(model_name)
        self.min_similarity = min_similarity
        self.preprocessor = QueryPreprocessor()
        
    def expand_query(self, 
                    query: str,
                    context: Optional[Dict[str, Any]] = None) -> ExpandedQuery:
        """Expand a query using multiple techniques.
        
        Args:
            query: Original query string
            context: Optional context information
            
        Returns:
            ExpandedQuery object with variations
        """
        try:
            # Preprocess query
            processed_query = self.preprocessor.preprocess(query)
            
            # Generate variations
            variations = []
            weights = []
            
            # Add original query
            variations.append(query)
            weights.append(1.0)
            
            # Add processed query if different
            if processed_query != query:
                variations.append(processed_query)
                weights.append(0.9)
                
            # Add entity-based variations
            entities = self.preprocessor.extract_entities(query)
            for entity_type, entity_list in entities.items():
                for entity in entity_list:
                    variation = f"{entity_type.lower()}: {entity}"
                    variations.append(variation)
                    weights.append(0.8)
                    
            # Add keyword-based variations
            keywords = self.preprocessor.extract_keywords(query)
            if keywords:
                variation = ' AND '.join(keywords)
                variations.append(variation)
                weights.append(0.7)
                
            # Add semantic variations
            semantic_variations = self._generate_semantic_variations(query)
            variations.extend(semantic_variations)
            weights.extend([0.6] * len(semantic_variations))
            
            # Normalize weights
            total_weight = sum(weights)
            weights = [w/total_weight for w in weights]
            
            return ExpandedQuery(
                original_query=query,
                expanded_queries=variations,
                weights=weights,
                context=context
            )
            
        except Exception as e:
            raise QueryError(f"Failed to expand query: {e}")
            
    def _generate_semantic_variations(self, query: str) -> List[str]:
        """Generate semantic variations of the query."""
        try:
            # Example semantic variations (in practice, you would use a more
            # sophisticated approach, possibly with a language model)
            variations = []
            
            # Add word order variations
            words = query.split()
            if len(words) > 2:
                for i in range(len(words)-1):
                    words[i], words[i+1] = words[i+1], words[i]
                    variation = ' '.join(words)
                    words[i], words[i+1] = words[i+1], words[i]  # Reset
                    variations.append(variation)
                    
            return variations
            
        except Exception as e:
            raise QueryError(f"Failed to generate semantic variations: {e}")
            
    def combine_results(self, 
                       expanded_query: ExpandedQuery,
                       results: List[List[Dict]]) -> List[Dict]:
        """Combine results from multiple query variations.
        
        Args:
            expanded_query: ExpandedQuery object
            results: List of results for each variation
            
        Returns:
            Combined and reranked results
        """
        try:
            if not results:
                return []
                
            # Combine all results
            combined = {}
            
            for variation_results, weight in zip(results, expanded_query.weights):
                for result in variation_results:
                    doc_id = result['id']
                    if doc_id not in combined:
                        combined[doc_id] = {
                            **result,
                            'score': 0.0,
                            'matched_queries': []
                        }
                    
                    # Update score and matched queries
                    combined[doc_id]['score'] += result['score'] * weight
                    combined[doc_id]['matched_queries'].append(
                        result.get('matched_query', expanded_query.original_query)
                    )
                    
            # Convert to list and sort by score
            final_results = list(combined.values())
            final_results.sort(key=lambda x: x['score'], reverse=True)
            
            return final_results
            
        except Exception as e:
            raise QueryError(f"Failed to combine results: {e}")
            
    def rerank_results(self, 
                      query: str,
                      results: List[Dict],
                      top_k: Optional[int] = None) -> List[Dict]:
        """Rerank results using semantic similarity.
        
        Args:
            query: Original query
            results: List of results to rerank
            top_k: Optional limit on number of results
            
        Returns:
            Reranked results
        """
        try:
            if not results:
                return []
                
            # Encode query and documents
            query_embedding = self.model.encode([query])[0]
            doc_embeddings = self.model.encode(
                [r['text'] for r in results]
            )
            
            # Compute similarities
            similarities = []
            for doc_embedding in doc_embeddings:
                similarity = np.dot(query_embedding, doc_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
                )
                similarities.append(float(similarity))
                
            # Update scores and sort
            for result, similarity in zip(results, similarities):
                result['semantic_score'] = similarity
                # Combine with original score
                result['final_score'] = (
                    0.7 * result['score'] + 
                    0.3 * result['semantic_score']
                )
                
            results.sort(key=lambda x: x['final_score'], reverse=True)
            
            if top_k:
                results = results[:top_k]
                
            return results
            
        except Exception as e:
            raise QueryError(f"Failed to rerank results: {e}") 