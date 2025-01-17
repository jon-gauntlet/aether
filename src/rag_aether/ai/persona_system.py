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
    """System for managing and using personas in RAG."""
    
    def __init__(self, config: PersonaConfig):
        """Initialize persona system.
        
        Args:
            config: Persona configuration
        """
        self.config = config
        self.rag = RAGSystem()
        self.optimizer = PerformanceOptimizer()
        
        # Initialize knowledge base
        for doc in config.knowledge_base:
            self.rag.ingest_message({
                "content": doc,
                "author": config.name,
                "timestamp": 0,
                "metadata": {
                    "type": "knowledge_base",
                    "persona": config.name
                }
            })
            
    def generate_response(self, query: str) -> str:
        """Generate a response using the persona.
        
        Args:
            query: User query
            
        Returns:
            Generated response
        """
        # Optimize query
        optimized_query, _ = self.optimizer.optimize_query(query)
        
        # Get relevant context
        results = self.rag.search(optimized_query)
        
        # Format response using persona style
        context = "\n".join(r["document"] for r in results)
        response = f"{self.config.name}: {context}"
        
        return response 