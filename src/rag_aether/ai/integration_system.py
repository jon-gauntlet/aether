"""Integration system combining RAG and Persona capabilities."""
import logging
from typing import List, Dict, Any, Optional
from .vector_store import VectorStore
from .persona_system import PersonaSystem
from .ml_client import MLClient

logger = logging.getLogger(__name__)

class IntegrationSystem:
    """System that combines RAG and Persona capabilities."""
    
    def __init__(self):
        """Initialize the integration system."""
        self.vector_store = VectorStore()
        self.persona_system = PersonaSystem()
        self.ml_client = MLClient()
        self.logger = logging.getLogger(__name__)
        
    async def process_message(
        self,
        user_id: str,
        message: str,
        conversation_history: List[Dict[str, Any]],
        metadata_filter: Optional[Dict[str, Any]] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Process a message using both RAG and Persona systems.
        
        Args:
            user_id: The user's ID
            message: The current message to process
            conversation_history: Previous messages in the conversation
            metadata_filter: Optional filter for RAG search
            max_tokens: Optional max tokens for response
            
        Returns:
            Dict containing response and context information
        """
        try:
            # Get relevant documents from RAG
            relevant_docs = await self.vector_store.similarity_search(
                query=message,
                k=4,  # Get top 4 relevant documents
                metadata_filter=metadata_filter
            )
            
            # Build context from documents and history
            context = {
                "relevant_documents": [doc["content"] for doc in relevant_docs],
                "conversation_history": conversation_history,
                "metadata_filter": metadata_filter
            }
            
            # Check user availability
            is_available = await self.persona_system.is_user_available(user_id)
            
            if not is_available:
                # Generate response using persona
                response = await self.persona_system.generate_response(
                    user_id=user_id,
                    context=context,
                    prompt=message,
                    max_tokens=max_tokens
                )
            else:
                # User is available, return indication
                response = None
                
            return {
                "response": response,
                "is_user_available": is_available,
                "relevant_documents": relevant_docs,
                "context_used": context
            }
            
        except Exception as e:
            self.logger.error(f"Failed to process message: {e}")
            raise
            
    async def analyze_user_messages(
        self,
        user_id: str,
        messages: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Analyze user messages to create/update their persona profile.
        
        Args:
            user_id: The user's ID
            messages: List of messages to analyze
            
        Returns:
            Dict containing profile and analysis information
        """
        try:
            # Create/update persona profile
            profile = await self.persona_system.analyze_user_style(
                user_id=user_id,
                messages=messages
            )
            
            # Extract key topics from messages for RAG
            message_texts = [msg["content"] for msg in messages]
            await self.vector_store.add_texts(
                texts=message_texts,
                metadata=[{"user_id": user_id, "type": "message"} for _ in messages]
            )
            
            return {
                "profile": profile.to_dict(),
                "message_count": len(messages),
                "indexed_for_search": True
            }
            
        except Exception as e:
            self.logger.error(f"Failed to analyze user messages: {e}")
            raise
            
    async def update_user_availability(
        self,
        user_id: str,
        active_hours: Dict[str, List[int]]
    ) -> bool:
        """Update a user's active hours in their profile.
        
        Args:
            user_id: The user's ID
            active_hours: Dict mapping days to [start_hour, end_hour]
            
        Returns:
            Boolean indicating success
        """
        try:
            # Get existing profile or create new one
            profile = await self.persona_system._load_profile(user_id)
            if not profile:
                # Create minimal profile if none exists
                profile = await self.persona_system.analyze_user_style(
                    user_id=user_id,
                    messages=[{"content": ""}]  # Empty analysis to create base profile
                )
            
            # Update active hours
            profile.active_hours = active_hours
            await self.persona_system._save_profile(profile)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to update user availability: {e}")
            raise 