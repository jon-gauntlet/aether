"""Persona-based interaction system."""

from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
import json
import logging
from pathlib import Path
import time

from ..errors import PersonaError

logger = logging.getLogger(__name__)

@dataclass
class PersonaConfig:
    """Configuration for a persona."""
    
    name: str
    description: str
    traits: Dict[str, float]
    knowledge_areas: List[str]
    communication_style: Dict[str, str]
    response_templates: Dict[str, List[str]]
    memory_config: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return {
            'name': self.name,
            'description': self.description,
            'traits': self.traits,
            'knowledge_areas': self.knowledge_areas,
            'communication_style': self.communication_style,
            'response_templates': self.response_templates,
            'memory_config': self.memory_config
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PersonaConfig':
        """Create config from dictionary."""
        return cls(**data)

@dataclass
class Interaction:
    """Record of an interaction with the persona."""
    
    query: str
    response: str
    context: Dict[str, Any]
    timestamp: float
    feedback: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert interaction to dictionary."""
        return {
            'query': self.query,
            'response': self.response,
            'context': self.context,
            'timestamp': self.timestamp,
            'feedback': self.feedback
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Interaction':
        """Create interaction from dictionary."""
        return cls(**data)

class PersonaMemory:
    """Manages persona's memory of interactions."""
    
    def __init__(self, config: Dict[str, Any]):
        self.max_interactions = config.get('max_interactions', 100)
        self.memory_decay = config.get('memory_decay', 0.1)
        self.interactions: List[Interaction] = []
        
    def add_interaction(self, interaction: Interaction) -> None:
        """Add an interaction to memory."""
        self.interactions.append(interaction)
        if len(self.interactions) > self.max_interactions:
            self.interactions.pop(0)
            
    def get_relevant_interactions(self, 
                                query: str,
                                max_results: int = 5) -> List[Interaction]:
        """Get interactions relevant to a query."""
        # Simple relevance scoring based on recency
        scored_interactions = []
        current_time = time.time()
        
        for interaction in self.interactions:
            time_diff = current_time - interaction.timestamp
            score = 1.0 / (1.0 + self.memory_decay * time_diff)
            scored_interactions.append((score, interaction))
            
        # Sort by score and return top results
        scored_interactions.sort(reverse=True)
        return [i[1] for i in scored_interactions[:max_results]]
        
    def clear(self) -> None:
        """Clear all interactions from memory."""
        self.interactions.clear()

class PersonaSystem:
    """Manages persona-based interactions."""
    
    def __init__(self, config_dir: Optional[str] = None):
        self.config_dir = Path(config_dir or '.personas')
        self.config_dir.mkdir(exist_ok=True)
        self.personas: Dict[str, PersonaConfig] = {}
        self.memories: Dict[str, PersonaMemory] = {}
        self._load_personas()
        
    def _get_config_path(self, name: str) -> Path:
        """Get path for persona config file."""
        return self.config_dir / f"{name}_config.json"
        
    def _load_personas(self) -> None:
        """Load all persona configurations."""
        try:
            for config_file in self.config_dir.glob("*_config.json"):
                with open(config_file) as f:
                    data = json.load(f)
                    config = PersonaConfig.from_dict(data)
                    self.personas[config.name] = config
                    self.memories[config.name] = PersonaMemory(
                        config.memory_config
                    )
        except Exception as e:
            raise PersonaError(f"Failed to load personas: {e}")
            
    def add_persona(self, config: PersonaConfig) -> None:
        """Add a new persona configuration."""
        try:
            self.personas[config.name] = config
            self.memories[config.name] = PersonaMemory(config.memory_config)
            
            # Save to disk
            config_path = self._get_config_path(config.name)
            with open(config_path, 'w') as f:
                json.dump(config.to_dict(), f)
                
        except Exception as e:
            raise PersonaError(f"Failed to add persona: {e}")
            
    def remove_persona(self, name: str) -> None:
        """Remove a persona configuration."""
        if name in self.personas:
            del self.personas[name]
            del self.memories[name]
            
            try:
                config_path = self._get_config_path(name)
                if config_path.exists():
                    config_path.unlink()
            except Exception as e:
                raise PersonaError(f"Failed to remove persona: {e}")
                
    def get_persona(self, name: str) -> Optional[PersonaConfig]:
        """Get a persona configuration."""
        return self.personas.get(name)
        
    def list_personas(self) -> List[str]:
        """List all available personas."""
        return list(self.personas.keys())
        
    def generate_response(self,
                         name: str,
                         query: str,
                         context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response using a persona."""
        if name not in self.personas:
            raise PersonaError(f"Unknown persona: {name}")
            
        try:
            persona = self.personas[name]
            memory = self.memories[name]
            context = context or {}
            
            # Get relevant past interactions
            relevant_interactions = memory.get_relevant_interactions(query)
            context['relevant_interactions'] = [
                i.to_dict() for i in relevant_interactions
            ]
            
            # Select response template based on query and context
            # (In practice, you would use more sophisticated selection)
            template = self._select_template(persona, query, context)
            
            # Generate response using template
            response = self._fill_template(template, {
                'query': query,
                'context': context,
                'persona': persona.to_dict()
            })
            
            # Record interaction
            interaction = Interaction(
                query=query,
                response=response,
                context=context,
                timestamp=time.time()
            )
            memory.add_interaction(interaction)
            
            return response
            
        except Exception as e:
            raise PersonaError(f"Failed to generate response: {e}")
            
    def _select_template(self,
                        persona: PersonaConfig,
                        query: str,
                        context: Dict[str, Any]) -> str:
        """Select appropriate response template."""
        # Simple template selection (in practice, use more sophisticated approach)
        templates = persona.response_templates
        
        # Default to general template if no match
        template_key = 'general'
        
        # Check for knowledge area matches
        for area in persona.knowledge_areas:
            if area.lower() in query.lower():
                template_key = area
                break
                
        # Get random template from matching category
        import random
        templates_list = templates.get(template_key, templates['general'])
        return random.choice(templates_list)
        
    def _fill_template(self, template: str, data: Dict[str, Any]) -> str:
        """Fill template with data."""
        # Simple template filling (in practice, use more sophisticated approach)
        filled = template
        
        # Replace basic placeholders
        filled = filled.replace('{query}', data['query'])
        filled = filled.replace('{persona_name}', data['persona']['name'])
        
        return filled
        
    def add_feedback(self,
                    name: str,
                    query: str,
                    feedback: Dict[str, Any]) -> None:
        """Add feedback for an interaction."""
        if name not in self.memories:
            raise PersonaError(f"Unknown persona: {name}")
            
        memory = self.memories[name]
        
        # Find matching interaction
        for interaction in reversed(memory.interactions):
            if interaction.query == query:
                interaction.feedback = feedback
                break 