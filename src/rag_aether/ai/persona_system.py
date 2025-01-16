from typing import Dict, List, Optional, Any
from datetime import datetime
from .quality_system import QualityMonitor
from .performance_system import PerformanceOptimizer
from .caching_system import CacheManager
from .rag_system import RAGSystem
from dataclasses import dataclass

class PersonaSystem:
    def __init__(self, rag_system: RAGSystem):
        """Initialize flow-aware persona system"""
        self.rag = rag_system
        self.quality_monitor = QualityMonitor()
        self.performance_optimizer = PerformanceOptimizer()
        self.cache_manager = CacheManager()
        
        # Flow state for persona
        self.flow_state = {
            "energy_balance": 1.0,
            "pattern_coherence": 1.0,
            "natural_rhythm": 1.0,
            "persona_alignment": 1.0
        }
        
        # Persona characteristics
        self.characteristics = {
            "style": {},
            "tone": {},
            "knowledge": {},
            "preferences": {}
        }
        
    def _update_flow_state(self, message_quality: float, response_time: float):
        """Update flow state based on persona metrics"""
        self.flow_state["energy_balance"] = self.performance_optimizer.calculate_energy_efficiency()
        self.flow_state["pattern_coherence"] = self.quality_monitor.assess_pattern_coherence()
        self.flow_state["natural_rhythm"] = self.performance_optimizer.measure_natural_rhythm()
        self.flow_state["persona_alignment"] = self.quality_monitor.assess_persona_alignment()
        
    def learn_from_messages(self, messages: List[Dict]) -> None:
        """Learn persona characteristics with flow protection"""
        cache_key = self.cache_manager.generate_key({"messages": messages})
        if (cached_characteristics := self.cache_manager.get(cache_key)):
            self.characteristics = cached_characteristics
            return
            
        with self.quality_monitor.measure_operation("learning"):
            # Extract patterns naturally
            style_patterns = self.performance_optimizer.extract_style_patterns(messages)
            tone_patterns = self.performance_optimizer.extract_tone_patterns(messages)
            knowledge_patterns = self.performance_optimizer.extract_knowledge_patterns(messages)
            preference_patterns = self.performance_optimizer.extract_preference_patterns(messages)
            
            # Update characteristics with flow awareness
            self.characteristics = {
                "style": style_patterns,
                "tone": tone_patterns,
                "knowledge": knowledge_patterns,
                "preferences": preference_patterns
            }
            
        # Cache learned characteristics
        self.cache_manager.store(cache_key, self.characteristics)
        
        # Update flow state
        self._update_flow_state(
            message_quality=self.quality_monitor.assess_learning_quality(self.characteristics),
            response_time=self.performance_optimizer.get_last_operation_time()
        )
        
    def generate_response(self, 
                         query: str,
                         context: Optional[Dict] = None) -> Dict:
        """Generate persona-aligned response with natural flow"""
        # Get context with flow protection
        if context is None:
            context = self.rag.search_context(query)
            
        # Check response cache
        cache_key = self.cache_manager.generate_key({
            "query": query,
            "context": context,
            "characteristics": self.characteristics
        })
        if (cached_response := self.cache_manager.get(cache_key)):
            return cached_response
            
        with self.quality_monitor.measure_operation("response_generation"):
            # Generate response with natural patterns
            base_response = self.performance_optimizer.generate_base_response(
                query, context, self.characteristics
            )
            
            # Apply persona characteristics naturally
            styled_response = self.performance_optimizer.apply_style(
                base_response, self.characteristics["style"]
            )
            toned_response = self.performance_optimizer.apply_tone(
                styled_response, self.characteristics["tone"]
            )
            
            # Ensure knowledge and preference alignment
            final_response = self.performance_optimizer.align_with_patterns(
                toned_response,
                self.characteristics["knowledge"],
                self.characteristics["preferences"]
            )
            
            response = {
                "content": final_response,
                "timestamp": datetime.now().timestamp(),
                "flow_metrics": self.flow_state,
                "persona_metrics": {
                    "style_alignment": self.quality_monitor.measure_style_alignment(final_response),
                    "tone_alignment": self.quality_monitor.measure_tone_alignment(final_response),
                    "knowledge_alignment": self.quality_monitor.measure_knowledge_alignment(final_response),
                    "preference_alignment": self.quality_monitor.measure_preference_alignment(final_response)
                }
            }
            
        # Cache response
        self.cache_manager.store(cache_key, response)
        
        # Update flow state
        self._update_flow_state(
            message_quality=self.quality_monitor.assess_response_quality(response),
            response_time=self.performance_optimizer.get_last_operation_time()
        )
        
        return response 

@dataclass
class PersonaConfig:
    """Configuration for a persona."""
    name: str
    description: str
    traits: Dict[str, float]  # trait -> strength (0-1)
    preferences: Dict[str, Any]
    memory_size: int = 100
    context_window: int = 2000
    temperature: float = 0.7
    max_tokens: int = 150
    stop_sequences: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None 