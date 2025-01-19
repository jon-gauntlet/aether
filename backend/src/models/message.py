from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class Message(BaseModel):
    id: str
    channel: str
    content: str
    timestamp: datetime = datetime.now()
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    file_url: Optional[str] = None 