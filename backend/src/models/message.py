from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    channel: str
    content: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    file_url: Optional[str] = None 