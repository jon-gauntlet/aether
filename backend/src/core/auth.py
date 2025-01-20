from typing import Optional
from datetime import datetime
import jwt
from fastapi import HTTPException, WebSocket
from pydantic import BaseModel
import httpx
from ..config import get_settings

settings = get_settings()

class User(BaseModel):
    id: str
    email: str

class AuthService:
    def __init__(self):
        self.supabase_url = settings.supabase_url
        self.supabase_key = settings.supabase_anon_key
        self.jwt_secret = settings.jwt_secret

    async def verify_token(self, token: str) -> Optional[User]:
        """Verify a JWT token and return the user if valid."""
        try:
            # First try to decode the token locally
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"]
            )
            
            # Verify with Supabase
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/auth/v1/user",
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {token}"
                    }
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return User(
                        id=user_data["id"],
                        email=user_data.get("email"),
                        created_at=datetime.fromisoformat(
                            user_data["created_at"].replace("Z", "+00:00")
                        ),
                        last_sign_in=datetime.fromisoformat(
                            user_data["last_sign_in_at"].replace("Z", "+00:00")
                        ) if user_data.get("last_sign_in_at") else None
                    )
                    
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None
            
        return None

    async def get_user_from_websocket(
        self,
        websocket: WebSocket,
        token: Optional[str] = None
    ) -> Optional[User]:
        """Get user from WebSocket connection."""
        if not token:
            # Try to get token from query parameters
            token = websocket.query_params.get("token")
            
        if not token:
            # Try to get token from headers
            token = websocket.headers.get("authorization", "").replace("Bearer ", "")
            
        if not token:
            return None
            
        return await self.verify_token(token)

    @staticmethod
    async def verify_websocket_token(websocket: WebSocket, token: Optional[str] = None) -> Optional[User]:
        if not token:
            return None
        try:
            # Mock auth for testing
            return User(id="test_user", email="test@example.com")
        except Exception:
            return None

auth_service = AuthService()

async def get_current_user(token: Optional[str] = None) -> Optional[User]:
    """Get the current user from a token."""
    if not token:
        return None
        
    user = await auth_service.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
        
    return user

async def verify_websocket_token(
    websocket: WebSocket,
    token: Optional[str] = None
) -> Optional[User]:
    """Verify WebSocket connection token."""
    user = await auth_service.get_user_from_websocket(websocket, token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return None
        
    return user 