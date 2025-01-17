from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import logging
from .performance_optimizer import PerformanceOptimizer
from .rag_system import RAGSystem

logger = logging.getLogger(__name__)

@dataclass
class PersonaConfig:
    """Configuration for a persona."""
    name: str
    description: str
    style: str
    knowledge_base: List[str]
    response_templates: List[str]
    metadata: Optional[Dict[str, Any]] = None

class PersonaSystem:
    def __init__(self, config: PersonaConfig):
        """Initialize the persona system.
        
        Args:
            config: PersonaConfig object containing persona settings
        """
        self.config = config
        self.rag_system = RAGSystem(use_production_features=True)
        self.optimizer = PerformanceOptimizer()
        
        # Initialize knowledge base
        if config.knowledge_base:
            self.rag_system.add_documents([
                {"content": text, "source": "knowledge_base"}
                for text in config.knowledge_base
            ])
            
    def generate_response(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response using the persona's style.
        
        Args:
            query: User query
            context: Optional context information
            
        Returns:
            Generated response
        """
        # Optimize query
        optimized_query = self.optimizer.optimize_query(query)
        
        # Get relevant documents
        results = self.rag_system.search(optimized_query)
        
        # Format response using persona style
        if not results:
            return self._format_response("I don't have enough information to answer that question.")
            
        # Combine relevant information
        context_info = " ".join(r["document"]["content"] for r in results)
        
        # Generate response using persona style
        response = self._format_response(context_info)
        return response
        
    def _format_response(self, content: str) -> str:
        """Format response according to persona style.
        
        Args:
            content: Raw response content
            
        Returns:
            Formatted response
        """
        # Apply persona's style
        if self.config.style == "formal":
            return f"Based on my knowledge, {content}"
        elif self.config.style == "casual":
            return f"Hey! {content}"
        elif self.config.style == "technical":
            return f"Technical analysis: {content}"
        else:
            return content 