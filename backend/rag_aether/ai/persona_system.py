"""Persona system for user personality mirroring and response generation."""
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import json
from supabase import create_client, Client
from .ml_client import MLClient
from ..config import load_credentials

logger = logging.getLogger(__name__)

@dataclass
class PersonaProfile:
    """User persona profile containing style characteristics."""
    user_id: str
    communication_style: Dict[str, float]  # e.g. {"formal": 0.8, "technical": 0.7}
    tone_preferences: Dict[str, float]  # e.g. {"friendly": 0.9, "professional": 0.8}
    common_phrases: List[str]
    average_response_length: int
    active_hours: Optional[Dict[str, List[int]]] = None  # e.g. {"monday": [9, 17]}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PersonaProfile':
        """Create a profile from a dictionary."""
        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to a dictionary."""
        return asdict(self)

class PersonaSystem:
    """System for managing user personas and generating personalized responses."""
    
    def __init__(self):
        """Initialize the persona system."""
        creds = load_credentials()
        self.ml_client = MLClient()
        self.supabase = create_client(creds.supabase_url, creds.supabase_key)
        self.profiles: Dict[str, PersonaProfile] = {}
        self.logger = logging.getLogger(__name__)
        
    async def analyze_user_style(
        self,
        user_id: str,
        messages: List[Dict[str, str]]
    ) -> PersonaProfile:
        """Analyze a user's communication style from their messages.
        
        Args:
            user_id: The user's ID
            messages: List of the user's messages with 'content' field
            
        Returns:
            PersonaProfile with analyzed characteristics
        """
        try:
            # First check if profile exists in Supabase
            existing_profile = await self._load_profile(user_id)
            if existing_profile:
                self.profiles[user_id] = existing_profile
                return existing_profile
            
            # Prepare analysis prompt
            analysis_prompt = [
                {"role": "system", "content": """Analyze the user's communication style and extract:
                1. Formality level (0-1)
                2. Technical language use (0-1)
                3. Tone characteristics
                4. Common phrases or expressions
                5. Typical message length
                Return as JSON."""},
                {"role": "user", "content": f"Messages to analyze: {[m['content'] for m in messages]}"}
            ]
            
            # Get analysis from ML model
            analysis_result = await self.ml_client.get_completion(
                messages=analysis_prompt,
                temperature=0.3
            )
            
            # Parse results and create profile
            # Note: In practice, we'd parse the JSON response more robustly
            style_data = eval(analysis_result)  # Simple for demo, use proper JSON parsing in production
            
            profile = PersonaProfile(
                user_id=user_id,
                communication_style={
                    "formal": style_data["formality_level"],
                    "technical": style_data["technical_level"]
                },
                tone_preferences=style_data["tone_characteristics"],
                common_phrases=style_data["common_phrases"],
                average_response_length=style_data["typical_length"]
            )
            
            # Store in memory and Supabase
            self.profiles[user_id] = profile
            await self._save_profile(profile)
            return profile
            
        except Exception as e:
            self.logger.error(f"Failed to analyze user style: {e}")
            raise

    async def generate_response(
        self,
        user_id: str,
        context: Dict[str, Any],
        prompt: str,
        max_tokens: Optional[int] = None
    ) -> str:
        """Generate a response matching the user's persona.
        
        Args:
            user_id: The user's ID
            context: Relevant context including conversation history
            prompt: The base prompt to respond to
            max_tokens: Optional max tokens for response
            
        Returns:
            Generated response text
        """
        try:
            # Try to load profile if not in memory
            profile = self.profiles.get(user_id)
            if not profile:
                profile = await self._load_profile(user_id)
                
            if not profile:
                self.logger.warning(f"No profile found for user {user_id}, using default style")
                return await self._generate_default_response(prompt, context)
            
            # Create a persona-aware prompt
            style_prompt = self._create_style_prompt(profile)
            messages = [
                {"role": "system", "content": style_prompt},
                {"role": "user", "content": f"Context: {context}\n\nPrompt: {prompt}"}
            ]
            
            # Generate response
            response = await self.ml_client.get_completion(
                messages=messages,
                max_tokens=max_tokens or profile.average_response_length,
                temperature=0.7  # Allow some creativity while maintaining style
            )
            
            return response
            
        except Exception as e:
            self.logger.error(f"Failed to generate response: {e}")
            raise
            
    async def _load_profile(self, user_id: str) -> Optional[PersonaProfile]:
        """Load a profile from Supabase."""
        try:
            result = self.supabase.table('persona_profiles').select('*').eq('user_id', user_id).execute()
            if result.data:
                profile_data = result.data[0]
                return PersonaProfile.from_dict(profile_data)
            return None
        except Exception as e:
            self.logger.error(f"Failed to load profile from Supabase: {e}")
            return None
            
    async def _save_profile(self, profile: PersonaProfile) -> None:
        """Save a profile to Supabase."""
        try:
            profile_data = profile.to_dict()
            self.supabase.table('persona_profiles').upsert(
                profile_data,
                on_conflict='user_id'
            ).execute()
        except Exception as e:
            self.logger.error(f"Failed to save profile to Supabase: {e}")
            raise
            
    def _create_style_prompt(self, profile: PersonaProfile) -> str:
        """Create a system prompt that guides response style based on profile."""
        style_desc = []
        
        # Add formality guidance
        formality = profile.communication_style.get("formal", 0.5)
        style_desc.append(
            f"{'Use formal language' if formality > 0.7 else 'Keep language casual'}"
        )
        
        # Add technical level guidance
        technical = profile.communication_style.get("technical", 0.5)
        style_desc.append(
            f"{'Use technical terminology' if technical > 0.7 else 'Avoid technical jargon'}"
        )
        
        # Add tone preferences
        tones = [
            tone for tone, value in profile.tone_preferences.items()
            if value > 0.7
        ]
        if tones:
            style_desc.append(f"Maintain a {', '.join(tones)} tone")
            
        # Add common phrases guidance
        if profile.common_phrases:
            style_desc.append(
                f"Occasionally use phrases like: {', '.join(profile.common_phrases[:3])}"
            )
            
        return f"""You are acting as a user's AI persona. Match their communication style:
{'. '.join(style_desc)}
Aim for responses around {profile.average_response_length} tokens.
Maintain consistency with the user's typical expression while staying natural."""
            
    async def _generate_default_response(
        self,
        prompt: str,
        context: Dict[str, Any]
    ) -> str:
        """Generate a response with default professional style when no profile exists."""
        messages = [
            {"role": "system", "content": """Generate a professional, balanced response.
Keep language clear and neutral. Avoid extreme formality or casualness."""},
            {"role": "user", "content": f"Context: {context}\n\nPrompt: {prompt}"}
        ]
        
        return await self.ml_client.get_completion(
            messages=messages,
            temperature=0.5
        )

    async def is_user_available(self, user_id: str) -> bool:
        """Check if a user is available based on their profile settings.
        
        Args:
            user_id: The user's ID
            
        Returns:
            Boolean indicating availability
        """
        profile = self.profiles.get(user_id)
        if not profile:
            profile = await self._load_profile(user_id)
            
        if not profile or not profile.active_hours:
            return True  # Default to available if no profile/hours set
            
        # TODO: Implement actual availability check based on active_hours
        return True 